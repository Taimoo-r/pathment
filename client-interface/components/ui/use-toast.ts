import { toast as sonnerToast } from "sonner";

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

export function useToast() {
  const toast = ({ title, description, variant, duration }: ToastProps) => {
    if (variant === "destructive") {
      sonnerToast.error(title || "Error", {
        description,
        duration: duration || 4000,
      });
    } else {
      sonnerToast.success(title || "Success", {
        description,
        duration: duration || 4000,
      });
    }
  };

  return { toast };
}
