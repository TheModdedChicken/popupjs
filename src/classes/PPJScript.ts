import { ClientScriptTagRegex } from "../regex";
import { DeconstructURL } from "../utility";

class PPJScript {
  url: {
    full: string
    file: string
  }
  type?: string
  name?: string
  author?: string
  description?: string
  data: {
    server?: string, // HTML
    client?: {
      data: string, // JS
      await?: boolean
    }
  } = {}

  invalid = false;

  constructor (url: string) {
    const fileURL = DeconstructURL(url); 
    this.url = {
      full: fileURL.location,
      file: fileURL.file
    };
    this.type = fileURL.ext;
  }

  async parse (callback: (script: this) => void) {
    try {
      const file = (await fetch(this.url.full));
      if (!file.ok) return this.invalid = true;
      const ext = this.type;

      console.log(`[PopupJS] Loading "${this.url.full}"`)

      switch (ext) {
        case "html":
        case "js": {
          const data = await file.text();
          const meta = (() => {
            const isCommentData = (data.includes("/*PPJS") && data.includes("PPJS*/"));
            const isElementData = data.search(/<ppjs([\s\S][^<])*\/>/g);

            var dataString: string;

            if (!isCommentData && isElementData > -1) return {};
            else if (isCommentData) {
              dataString = data.split("/*PPJS")[1].split("PPJS*/")[0];
            } else {
              dataString = data.split("<ppjs")[1].split("/>")[0];
              /*const startOfData = isElementData;
              const endOfData = (() => {
                for (var i = startOfData; i > data.length - 1; i++) {
                  if (data[i] === "/" && (i + 1) <= (data.length - 1) && data[i + 1] === ">") return i + 1;
                }
              })();

              dataString = data.substring(startOfData + 4, endOfData - 2);*/
            }

            return {
              name: dataString.includes('name=') ? dataString.split('name="')[1].split('"')[0] : null,
              author: dataString.includes('author=') ? dataString.split('author="')[1].split('"')[0] : null,
              description: dataString.includes('description=') ? dataString.split('description="')[1].split('"')[0] : null
            }
          })();

          this.name = meta.name
          this.author = meta.author
          this.description = meta.description

          await this.load(this.url.full);

          break;
        }

        case "json": {
          const data = await file.json();

          // await (await fetch(data.url)).text()

          this.name = data.name
          this.author = data.author
          this.description = data.description

          await this.load(data.url);

          break;
        }
      }
    } catch (err) { this.invalid = true; console.error(err) }

    callback(this);
  }

  private async load (fileURL: string) {
    const file = DeconstructURL(fileURL);

    switch (file.ext) {
      case "js": {
        const data = await (await fetch(file.location)).text();
        this.data.client = { data };
        break;
      }

      case "html": {
        const data = await (await fetch(file.location)).text();
        this.data.server = data;

        // const server_script = data.match(/<script[\s\S]* ppjs_server( [\s\S]*>|>)[\s\S]*<!-- *ppjs_server *-->/g)[0];
        const client_script = data.match(/(<script[^(<!\-\-ppjs_server\-\->)]* ppjs_client( [^>]*>| *>))[\s\S]*<!-- *ppjs_client *-->/)[0];

        const codeS1 = client_script.split(/(<script[^(<!\-\-ppjs_server\-\->)]* ppjs_client( [^>]*>| *>))/);
        const codeFinal = codeS1[codeS1.length - 1].split(/<\/script>[\s]*<!-- *ppjs_client *-->/)[0];
        this.data.client = {
          data: codeFinal,
          await: (/(<script[\s\S]* ppjs_await( [^>]*>| *>))/).test(client_script)
        }
      }
    }
  }

  run () {
    window.addEventListener('message', (e) => {
      if (e.data.command === "popupjs:injector:ready" && this.data.server) {
        document.open('text/html');
        document.write(this.data.server.split(/(<script[^(<!\-\-ppjs_server\-\->)]* ppjs_client( [^>]*>| *>))[\s\S]*<!-- *ppjs_client *-->/)[0]); // Add beforescriptexecute
        document.close();
      }
    })

    if (!this.data.client?.await) {
      window.opener.window.postMessage({
        command: "popupjs:eval",
        body: (
          !this.data.server ? 
          `window.open('', '${window.name}').close();\n` : 
          `window.open('', '${window.name}').postMessage({ command: 'popupjs:injector:ready' });`
        ) + this.data.client.data
      }, "*")
      console.log(this.data.client.data)
    } else {
      window.opener.window.postMessage({
        command: "popupjs:eval",
        body: `
          window.open('', '${window.name}').postMessage({
            command: 'popupjs:injector:ready'
          });
          
          window.addEventListener("message", (e) => {
            var ppjs_client_data = \`${this.data.client.data.replaceAll('`', '\\`')}\`;

            function parseTTScript (script) {
              return typeof trustedTypes !== 'undefined' ? 
              trustedTypes.createPolicy("ppjs", { createScript: string => string }).createScript(script) : script
            }

            if (e.data.command==="popupjs:env:insert") ppjs_client_data = ppjs_client_data.replace('#/{' + e.data.body.name.toUpperCase() + '}/#', e.data.body.value);
            else if (e.data.command==="popupjs:client:run") {eval( parseTTScript(ppjs_client_data) ); console.log("test12222")}
            else if (e.data.command==="popupjs:client:dump") ppjs_client_data = '';
          })
        `
      }, "*")
    }
  }

  isInvalid () { return this.invalid; }
}

export default PPJScript