import Swal from "sweetalert2";

/**
 * Universal SweetAlert2 styled helper conforming to Imlaa Design System:
 * - Primary Plum: #6D4E56
 * - Hover Plum: #5A3E45
 * - Charcoal Body: #1F2937
 * - Border: rgba(109, 78, 86, 0.2)
 * - Font: Roboto
 */
const ImlaaSwal = Swal.mixin({
  customClass: {
    popup: "imlaa-swal-popup",
    title: "imlaa-swal-title",
    htmlContainer: "imlaa-swal-html",
    confirmButton: "imlaa-swal-confirm",
    cancelButton: "imlaa-swal-cancel",
  },
  buttonsStyling: false,
  reverseButtons: true,
  background: "#ffffff",
});

export const showConfirmModal = async ({
  title,
  text,
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  isDanger = false,
  icon = "warning",
}) => {
  return ImlaaSwal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    customClass: {
      popup: "imlaa-swal-popup",
      title: "imlaa-swal-title",
      htmlContainer: "imlaa-swal-html",
      confirmButton: isDanger ? "imlaa-swal-danger" : "imlaa-swal-confirm",
      cancelButton: "imlaa-swal-cancel",
    },
  });
};

export const showSuccessToast = (title, text = "") => {
  return ImlaaSwal.fire({
    icon: "success",
    title,
    text,
    timer: 2500,
    showConfirmButton: false,
    toast: false,
  });
};

export const showErrorAlert = (title, text = "") => {
  return ImlaaSwal.fire({
    icon: "error",
    title,
    text,
    confirmButtonText: "Understood",
  });
};

export const showWarningAlert = (title, text = "") => {
  return ImlaaSwal.fire({
    icon: "warning",
    title,
    text,
    confirmButtonText: "Acknowledge",
  });
};

export default ImlaaSwal;
