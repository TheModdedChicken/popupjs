<script lang="ts">

  import { dataset_dev } from "svelte/internal";

</script>
<div>
  <script>
    window.addEventListener("message", (e) => {
      var ppjs_client_data = ``

      function parseTTScript (script) {
        return typeof trustedTypes !== 'undefined' ? 
        trustedTypes.createPolicy("ppjs", { createScript: string => string }).createScript(script) : script
      }

      if (e.data.command==="popupjs:env:insert") ppjs_client_data = ppjs_client_data.replace(`#/{${e.data.body.name.toUpperCase()}}/#`, e.data.body.value);
      else if (e.data.command==="popupjs:client:run") eval( parseTTScript(ppjs_client_data) );
      else if (e.data.command==="popupjs:client:dump") ppjs_client_data = '';
    })
  </script>
</div>