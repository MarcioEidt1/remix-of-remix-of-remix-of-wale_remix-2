import { useState, forwardRef, InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  containerClassName?: string;
}

/**
 * Campo de senha padronizado para a área administrativa.
 * Inclui toggle de visibilidade (olho) com semântica de ação:
 * - Eye    = senha oculta (clique para mostrar)
 * - EyeOff = senha visível (clique para ocultar)
 */
const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className = "", containerClassName = "", autoComplete = "new-password", ...props }, ref) => {
    const [show, setShow] = useState(false);

    const baseClass =
      "w-full px-4 py-3 pr-10 bg-secondary text-foreground border border-border rounded-sm font-body text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors";

    return (
      <div className={`relative ${containerClassName}`}>
        <input
          ref={ref}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          className={className || baseClass}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          title={show ? "Ocultar senha" : "Mostrar senha"}
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
          tabIndex={-1}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
