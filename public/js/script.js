// Example starter JavaScript for disabling form submissions if there are invalid fields
(() => {
  'use strict'

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })
})()

const imageInput = document.querySelector("#image");
const imagePreview = document.querySelector("#image-preview");

if (imageInput && imagePreview) {
  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];

    if (!file) return;

    imagePreview.src = URL.createObjectURL(file);
    imagePreview.classList.remove("d-none");
  });
}
