const $ = id => document.getElementById(id);
const serviceGuidance = {
  linux: "Use systemctl show for the actual unit to compare ExecStart, WorkingDirectory and User. For a manual launch, inspect its arguments, working directory and account locally. If a custom data, configuration or launch path is active, stop at this review.",
  windows: "Use Get-CimInstance Win32_Service to compare Name, PathName and StartName. For a manual launch, inspect the process path, arguments and owner locally. If a custom data, configuration or launch path is active, stop at this review."
};
const accountGuidance = {
  linux: "Run the command as the existing service account. Quote paths with spaces.",
  windows: "Run in PowerShell as an authorized operator. Check that the backup directory has restricted ACLs and quote paths with spaces."
};

export function connectAdoption({api,help,onCandidate}) {
  let preview = null;
  let pending = false;

  function resetReview() {
    preview = null;
    $("adoption-review").hidden = true;
    $("service-confirmed").checked = false;
    $("backup-form").hidden = true;
    $("backup-parent").value = "";
    $("handoff").hidden = true;
    $("adoption-status").textContent = "";
  }

  async function review(backupParent) {
    if(pending)return;
    pending = true;
    for(const id of ["root","preview","service-confirmed","backup-parent","check-backup"])$(id).disabled = true;
    const checkingBackup = backupParent !== undefined;
    if(checkingBackup)$("handoff").hidden = true;
    else resetReview();
    $("adoption-status").textContent = checkingBackup ? "Checking backup path…" : "Reading installation details…";
    try {
      const result = await api("/api/adoption/preview",{root:$("root").value,backupParent});
      if(result.existingCandidate)onCandidate();
      help(result.help);
      const {root,version,files,backupDirectory} = result.preview;
      if(checkingBackup) {
        if(root !== preview.root || version !== preview.version || files.join() !== preview.files.join()){
          resetReview();
          $("adoption-status").textContent = "Installation details changed. Preview the root again.";
          return;
        }
        $("handoff-backup").textContent = "Backup path checked: " + backupDirectory + ". Verify access, available space and the service state in the terminal.";
        $("handoff-account").textContent = accountGuidance[result.platform];
        $("handoff").hidden = false;
        $("adoption-status").textContent = "Backup path checked. No backup or adoption has run.";
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
      if(checkingBackup&&!error.message.startsWith("MW-ADOPT-BACKUP"))resetReview();
      $("adoption-status").textContent = error.message;
    } finally {
      pending = false;
      for(const id of ["root","preview","service-confirmed","backup-parent","check-backup"])$(id).disabled = false;
    }
  }

  $("root").addEventListener("input", resetReview);
  $("backup-parent").addEventListener("input", () => {$("handoff").hidden = true;});
  $("service-confirmed").addEventListener("change", event => {
    $("backup-form").hidden = !event.target.checked;
    if(!event.target.checked)$("handoff").hidden = true;
  });
  $("adoption-root").addEventListener("submit", event => {
    event.preventDefault();
    review();
  });
  $("backup-form").addEventListener("submit", event => {
    event.preventDefault();
    if(preview && $("service-confirmed").checked)review($("backup-parent").value);
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
