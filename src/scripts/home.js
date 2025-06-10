
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal");
  const startBtn = document.getElementById("start-btn");
  const fileInput = document.getElementById("file-input");
  const customButton = document.getElementById("custom-button");
  const fileNameField = document.getElementById("file-name");
  const uploadBtn = document.getElementById("upload-btn");

  startBtn.onclick = () => {
    modal.style.display = "flex";
  };

  window.closeModal = function () {
    modal.style.display = "none";
  };

  if (customButton && fileInput) {
    customButton.addEventListener("click", () => {
      fileInput.click();
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", () => {
      if (fileInput.files.length > 0) {
        fileNameField.value = fileInput.files[0].name;
      } else {
        fileNameField.value = "Nenhum arquivo selecionado";
      }
    });
  }

  if (uploadBtn) {
    uploadBtn.addEventListener("click", () => {
      if (!fileInput.files[0]) {
        alert("Selecione uma imagem primeiro.");
        return;
      }

      const reader = new FileReader();
      reader.onload = function (e) {
        sessionStorage.setItem("imagemBase64", e.target.result);
        window.location.href = "src/pages/template-edição.html";
      };
      reader.readAsDataURL(fileInput.files[0]);
    });
  }
});
