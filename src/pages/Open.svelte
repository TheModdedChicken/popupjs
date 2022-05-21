<script>
  import DOMPurify from 'dompurify';

  const params = new URLSearchParams(window.location.search);
  const hasFile = params.has('file');
  const isPopup = (window.opener && window.opener !== window);
  var isInvalid = false;

  var fileData = null;

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
          fileData = {
            type: ext,
            name: data.name,
            author: data.author,
            file: DeconstructURL(data.file).file,
            description: data.description,
            script: await (await fetch(data.file)).text()
          }
        } else {
          fileData = {
            type: ext,
            name: null,
            author: null,
            file: fileURL.file,
            description: null,
            script: ext === "js" ? await file.text() : null
          }
        }
      } catch { isInvalid = true }
    })()
  }

  function DeconstructURL (url) {
    const fileLoc = (() => { 
      var file = url; 
      if (!file.includes('http://') && !file.includes('https://')) file = 'https://' + file;
      try { return new URL(file).href; } catch { isInvalid = true }
    })();

    const fileFull = (() => {
      const split = fileLoc.split('/');
      console.log(split)
      return split[split.length - 1];
    })();

    const fileExt = (() => {
      const split = fileFull.split('.');
      const ext = split[split.length - 1];
      return ["js", "json", "html"].includes(ext) ? ext : null;
    })();

    return {
      location: fileLoc,
      file: fileFull,
      ext: fileExt
    }
  }
</script>

<h3>PopupJS</h3>
<div id="content">
  {#if isInvalid}
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
        <div><span style="color: #2d3436; font-size: 2vh;">File: </span><span id="script-name">{fileData.file || "Unknown"}</span></div>
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
                from: "popupjs",
                command: "eval",
                body: DOMPurify.sanitize(fileData.script)
              }, "*")
            } else window.location = fileData.file;
            window.close()

          }}>Run</button>
        </div>
      </div>
    {:else}
      <p>
        <span style="color: #fdcb6e; font-size: 2vh;">Loading</span><br>
        If this takes longer than 10 seconds please check your network connection.
      </p>
    {/if}
  {:else}
    <p>Please load this page as a popup.</p>
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