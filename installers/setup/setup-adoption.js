const $ = id => document.getElementById(id);
const serviceGuidance = {
  linux: "Use systemctl to find the unit name ending in .service. Check the registered launch, service account and current state.",
  windows: "Use Get-CimInstance Win32_Service to find the Name of the MeshCentral service. Check the registered launch, service account and current state."
};
const serviceErrors = {
  invalid:"Enter the registered service name shown by the local service manager.",
  missing:"No service with that name was found.",
  mismatch:"The service points to a different installation. Compare the service name with the selected directory.",
  unsupported:"The service uses a launch configuration that needs manual inspection. Check the effective paths before adoption.",
  unavailable:"The local service registry could not be read. Check it in the terminal."
};
const accountGuidance = {
  linux: "Run the command as the existing service account. Quote paths with spaces.",
  windows: "Run in PowerShell as an authorized operator. Check that the backup directory has restricted ACLs and quote paths with spaces."
};

export function connectAdoption({api,help,onCandidate}) {
  let preview = null;
  let service = null;
  let pending = false;
  const inputIds = ["root","preview","service-name","check-service","service-confirmed","backup-parent","check-backup"];

  function updateService(value,changed=false) {
    service=value;
    const verified=value?.status==="verified";
    $("service-state").textContent = verified
      ? value.name + " · " + value.state + " · Account " + value.account
      : value ? "MW-ADOPT-SERVICE · " + (changed?"Service verification changed. ":"") + (serviceErrors[value.status]??serviceErrors.unavailable) : "";
    $("service-confirmed").disabled = pending || (Boolean($("service-name").value) && !verified);
  }

  function invalidateService() {
    updateService(null);
    $("service-confirmed").checked=false;
    $("backup-form").hidden=true;
    $("handoff").hidden=true;
  }

  function resetReview() {
    preview = null;
    $("adoption-review").hidden = true;
    $("service-name").value = "";
    invalidateService();
    $("backup-parent").value = "";
    $("handoff").hidden = true;
    $("adoption-status").textContent = "";
  }

  async function review({backupParent,serviceName}={}) {
    if(pending)return;
    pending = true;
    for(const id of inputIds)$(id).disabled = true;
    const checkingBackup = backupParent !== undefined;
    const checkingService = !checkingBackup && serviceName !== undefined;
    let serviceChanged = false;
    if(checkingBackup)$("handoff").hidden = true;
    else if(checkingService)invalidateService();
    else resetReview();
    $("adoption-status").textContent = checkingBackup ? "Checking backup path…" : checkingService ? "Reading service registration…" : "Reading installation details…";
    try {
      const result = await api("/api/adoption/preview",{root:$("root").value,backupParent,serviceName});
      if(result.existingCandidate)onCandidate();
      help(result.help);
      const {root,version,files,backupDirectory,service:reviewedService} = result.preview;
      if((checkingBackup||checkingService)&&(root!==preview.root||version!==preview.version||files.join()!==preview.files.join())){
        resetReview();
        $("adoption-status").textContent="Installation details changed. Preview the root again.";
        return;
      }
      if(checkingBackup) {
        if(reviewedService&&(reviewedService.name!==service?.name||reviewedService.account!==service?.account)){
          invalidateService();
          serviceChanged=true;
          $("adoption-status").textContent="The service or account changed. Verify it again.";
          return;
        }
        updateService(reviewedService);
        $("handoff-backup").textContent = "Backup path checked: " + backupDirectory + ". Verify access, available space and the service state in the terminal.";
        $("handoff-account").textContent = accountGuidance[result.platform];
        $("handoff-service").hidden=!reviewedService;
        $("handoff-apply").textContent="node installers/adopt.mjs apply <root> <private-backup-parent> --engine-stopped"+(reviewedService?" --service <service-name>":"");
        $("handoff").hidden = false;
        $("adoption-status").textContent = "Backup path checked. No backup or adoption has run.";
        return;
      }
      if(checkingService){
        updateService(reviewedService);
        $("adoption-status").textContent="";
        return;
      }
      preview = result.preview;
      $("preview-target").textContent = "MeshCentral " + version + " · " + root;
      $("file-summary").textContent = files.length + " files to add under meshcentral-web/public";
      $("preview-files").replaceChildren(...files.map(path => {
        const row = document.createElement("li");
        row.textContent = path;
        return row;
      }));
      $("service-guide").textContent = serviceGuidance[result.platform];
      $("adoption-review").hidden = false;
      $("adoption-status").textContent = "Read-only preview ready. Confirm the service before checking the backup path.";
    } catch(error) {
      if(error.detail?.existingCandidate)onCandidate();
      help(error.detail?.help);
      if(error.detail?.service){
        invalidateService();
        $("adoption-status").textContent="";
        service=error.detail.service;
        serviceChanged=true;
      }else{
        if((checkingBackup||checkingService)&&!error.message.startsWith("MW-ADOPT-BACKUP"))resetReview();
        $("adoption-status").textContent = error.message;
      }
    } finally {
      pending = false;
      for(const id of inputIds)$(id).disabled = false;
      updateService(service,serviceChanged);
      if(serviceChanged)$("check-service").focus();
    }
  }

  $("root").addEventListener("input", resetReview);
  $("service-name").addEventListener("input", invalidateService);
  $("backup-parent").addEventListener("input", () => {$("handoff").hidden = true;});
  $("service-confirmed").addEventListener("change", event => {
    $("backup-form").hidden = !event.target.checked;
    if(!event.target.checked)$("handoff").hidden = true;
  });
  $("adoption-root").addEventListener("submit", event => {
    event.preventDefault();
    review();
  });
  $("service-form").addEventListener("submit", event=>{
    event.preventDefault();
    if(preview)review({serviceName:$("service-name").value});
  });
  $("backup-form").addEventListener("submit", event => {
    event.preventDefault();
    if(preview && $("service-confirmed").checked)review({backupParent:$("backup-parent").value,serviceName:service?.status==="verified"?service.name:undefined});
  });

  return {
    showDiscovery({candidates,existingCandidate}) {
      const blocked = candidates.length > 0 || existingCandidate;
      $("discovery").textContent = blocked
        ? "An existing installation was found. Fresh installation is blocked for this wizard session."
        : "No candidate found in the checked locations. Enter the directory for a custom installation.";
      $("adoption").open ||= Boolean(blocked);
      $("candidates").hidden = !candidates.length;
      $("candidates").replaceChildren(...candidates.map(candidate => {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = candidate.root + " · " + candidate.version;
        button.addEventListener("click", () => {
          if(pending)return;
          $("root").value = candidate.root;
          resetReview();
          $("root").focus();
        });
        item.append(button);
        return item;
      }));
      $("preview").disabled = pending;
    },
    setAvailable(available) {
      $("adoption").hidden = !available;
    }
  };
}
