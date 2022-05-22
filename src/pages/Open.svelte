<script lang="ts">
  window.addEventListener("message", (event) => {
    if (event.data.from !== "popupjs") return;

    console.log(event.data.command)
    if (event.data.command === "res:inject:success") window.close();
  })

  const params = new URLSearchParams(window.location.search);
  const hasFile = params.has('file');
  const isPopup = (window.opener && window.opener !== window);
  var isInvalid = false;
  var isRunning = false;

  var fileData: { 
    type?: string, 
    name?: string, 
    author?: string, 
    file: string, 
    url: string, 
    description?: string, 
    script?: string 
  } | null = null;

  if (hasFile) {
    const fileURL = DeconstructURL(params.get('file'));
    
    (async () => {
      try {
        const file = (await fetch(fileURL.location));
        if (!file.ok) isInvalid = true;
        const ext = fileURL.ext;

        console.log(`[PopupJS] Loading "${fileURL.location}"`)
        if (ext === "json") {
          const data = await file.json();
          const deFile = DeconstructURL(data.url);

          fileData = {
            type: ext,
            name: data.name,
            author: data.author,
            file: deFile.file,
            url: deFile.location,
            description: data.description,
            script: await (await fetch(data.url)).text()
          }

          console.log(fileData)
        } else {
          const data = await file.text();
          const meta = (() => {
            if (!data.includes("/*PPJS") && !data.includes("PPJS*/")) return {};
            const info = data.split("/*PPJS")[1].split("PPJS*/")[0];

            return {
              name: info.includes('name=') ? info.split('name="')[1].split('"')[0] : null,
              author: info.includes('author=') ? info.split('author="')[1].split('"')[0] : null,
              description: info.includes('description=') ? info.split('description="')[1].split('"')[0] : null
            }
          })();

          fileData = {
            type: ext || "html",
            name: meta.name || null,
            author: meta.author || null,
            file: fileURL.file,
            url: fileURL.location,
            description: meta.description || null,
            script: ext === "js" ? data : null
          }
        }
      } catch (err) { isInvalid = true; console.log(err) }
    })()
  }

  function DeconstructURL (url: string) {
    const location = (() => { 
      var file = url; 
      if (!file.includes('http://') && !file.includes('https://')) file = 'https://' + file;
      try { return new URL(file).href; } catch { isInvalid = true }
    })();

    const file = (() => {
      const split = location.split('/');
      console.log(split)
      return split[split.length - 1];
    })();

    const ext = (() => {
      const split = file.split('.');
      const ext = split[split.length - 1];
      return ["js", "json"].includes(ext) ? ext : null;
    })();

    return { location, file, ext }
  }
</script>

<h3>PopupJS</h3>
<div id="content">
  {#if isInvalid && isPopup}
    <p>Could not load referenced file.</p><br>
    <p>Stuck? Go <a href="/info">here</a></p>
  {:else if !hasFile}
    <p>Please reference a JavaScript file or HTML file with the 'file' parameter and try again.</p><br>
    <p>Stuck? Go <a href="/info">here</a></p>
  {:else if isPopup}
    {#if fileData}
      <div class="popup-warning">
        <p>
          <span style="color: red; font-size: 2vh;">WARNING</span><br>
          Please ensure you trust the script you're loading.
        </p>
      </div>
      <div class="popup-ask">
        <div><span style="color: #2d3436; font-size: 2vh;">File: </span><span id="script-file">{fileData.file || "Unknown"}</span></div>
        <div><span style="color: #2d3436; font-size: 2vh;">Name: </span><span id="script-name">{fileData.name || "Unknown"}</span></div>
        <div><span style="color: #2d3436; font-size: 2vh;">Author: </span><span id="script-author">{fileData.author || "Unknown"}</span></div>
        <div>
          <span style="color: #2d3436; font-size: 2vh;">Description: </span><br>
          <span id="script-description">{fileData.description || "Unknown"}</span>
        </div>
        <div>
          <button on:click={() => {
            console.log("[PopupJS] Blocking Script")
            window.close();
          }}>Block</button><button on:click={() => {

            console.log("[PopupJS] Running Script")
            if (["js", "json"].includes(fileData.type)) {
              window.opener.window.postMessage({
                command: "popupjs:eval",
                body: `window.open('', '${window.name}').close();\n` + fileData.script
              }, "*")
            } else window.location.href = fileData.url;
            isRunning = true;

          }}>Run</button>
        </div>
      </div>
    {:else if !isRunning}
      <p>
        <span style="color: #fdcb6e; font-size: 2vh;">Loading</span><br>
        If this takes longer than 10 seconds please check your network connection.
      </p>
    {:else}
      <p>
        Attempting to run...
      </p>
    {/if}
  {:else}
    <p>Please load this page as a popup.</p>
    <p>Stuck? Go <a href="/info">here</a></p>
  {/if}
</div>

<style>
  .popup-ask, .popup-warning {
    background: #dfe6e9;
    width: 40vh;
    height: min-content;

    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    flex-direction: column;

    text-align: center;

    margin: 5px;
  }

  .popup-ask {
    padding: 10px 0 10px 0;
  }

  .popup-ask > * {
    margin: 7px;
  }
</style>