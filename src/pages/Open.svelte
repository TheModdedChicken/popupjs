<script lang="ts">
  import PPJScript from "../classes/PPJScript";
  import { DeconstructURL } from "../utility";
  import { writable } from "svelte/store";


  /*window.addEventListener("message", (event) => {
    if (event.data.from !== "popupjs") return;

    console.log(event.data.command)
    if (event.data.command === "res:inject:success") window.close();
  })*/

  const params = new URLSearchParams(window.location.search);
  const hasFile = params.has('file');
  const isPopup = (window.opener && window.opener !== window);
  var isRunning = false;

  var mainScript: PPJScript | null = null;

  if (isPopup) window.resizeTo(500, 700);

  /**
   * Parse JS, HTML, JSON
   * 
   * JS:
   *  1. Look for metadata
   *  2. Run script
   * 
   * HTML:
   *  1. Look for metadata
   *  2. Find ppjs_server and ppjs_client
   *  3. Check if client script is async
   *  3a. If client is async: preload script and environment, and wait for run confirmation
   *  3b. If client is sync: run script
  */

  if (hasFile) {
    try { 
      new PPJScript(params.get('file')).parse((s) => {
        mainScript = s;
        if (s.isInvalid()) throw new Error("Script is Invalid");
      });
    } catch {}
  }
</script>

<h3>PopupJS</h3>
<div id="content">
  {#if !mainScript}
    <p>
      <span style="color: #fdcb6e; font-size: 2vh;">Loading</span><br>
      If this takes longer than 10 seconds please check your network connection.
    </p>
  {:else if mainScript.isInvalid() && isPopup}
    <p>Could not load referenced file.</p><br>
    <p>Stuck? Go <a href="/info">here</a></p>
  {:else if !hasFile}
    <p>Please reference a JavaScript file or HTML file with the 'file' parameter and try again.</p><br>
    <p>Stuck? Go <a href="/info">here</a></p>
  {:else if isPopup}
    {#if !isRunning}
      <div class="popup-warning">
        <p>
          <span style="color: red; font-size: 2vh;">WARNING</span><br>
          Please ensure you trust the script you're loading.
        </p>
      </div>
      <div class="popup-ask">
        <div><span style="color: #2d3436; font-size: 2vh;">File: </span><span id="script-file">{mainScript.url.file || "Unknown"}</span></div>
        <div><span style="color: #2d3436; font-size: 2vh;">Name: </span><span id="script-name">{mainScript.name || "Unknown"}</span></div>
        <div><span style="color: #2d3436; font-size: 2vh;">Author: </span><span id="script-author">{mainScript.author || "Unknown"}</span></div>
        <div>
          <span style="color: #2d3436; font-size: 2vh;">Description: </span><br>
          <span id="script-description">{mainScript.description || "Unknown"}</span>
        </div>
        <div>
          <button on:click={() => {
            console.log("[PopupJS] Canceling Script")
            window.close();
          }}>Cancel</button><button on:click={() => {

            console.log("[PopupJS] Running Script")

            console.log(`Await: ${mainScript.data.client.await}`)
            mainScript.run()

            isRunning = true;

          }}>Run</button>
        </div>
      </div>
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