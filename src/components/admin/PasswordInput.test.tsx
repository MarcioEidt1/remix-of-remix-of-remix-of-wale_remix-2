import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PasswordInput from "./PasswordInput";

describe("PasswordInput", () => {
  it("inicia mascarado (type=password) e com aria-label 'Mostrar senha'", () => {
    render(<PasswordInput placeholder="Senha" />);
    const input = screen.getByPlaceholderText("Senha") as HTMLInputElement;
    expect(input.type).toBe("password");
    expect(screen.getByLabelText("Mostrar senha")).toBeInTheDocument();
  });

  it("revela o texto ao clicar no toggle e alterna ícones/labels", () => {
    render(<PasswordInput placeholder="Senha" />);
    const input = screen.getByPlaceholderText("Senha") as HTMLInputElement;
    const toggle = screen.getByLabelText("Mostrar senha");

    fireEvent.click(toggle);
    expect(input.type).toBe("text");
    expect(screen.getByLabelText("Ocultar senha")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Ocultar senha"));
    expect(input.type).toBe("password");
    expect(screen.getByLabelText("Mostrar senha")).toBeInTheDocument();
  });

  it("preserva o valor digitado ao alternar visibilidade", () => {
    render(<PasswordInput placeholder="Senha" defaultValue="Teste@123" />);
    const input = screen.getByPlaceholderText("Senha") as HTMLInputElement;
    expect(input.value).toBe("Teste@123");

    fireEvent.click(screen.getByLabelText("Mostrar senha"));
    expect(input.type).toBe("text");
    expect(input.value).toBe("Teste@123");
  });

  it("usa autoComplete=new-password por padrão", () => {
    render(<PasswordInput placeholder="Senha" />);
    expect(screen.getByPlaceholderText("Senha")).toHaveAttribute(
      "autocomplete",
      "new-password"
    );
  });

  it("aceita autoComplete customizado (ex.: current-password)", () => {
    render(<PasswordInput placeholder="Senha" autoComplete="current-password" />);
    expect(screen.getByPlaceholderText("Senha")).toHaveAttribute(
      "autocomplete",
      "current-password"
    );
  });

  it("mantém estado independente entre múltiplas instâncias", () => {
    render(
      <>
        <PasswordInput placeholder="Senha A" />
        <PasswordInput placeholder="Senha B" />
      </>
    );
    const inputA = screen.getByPlaceholderText("Senha A") as HTMLInputElement;
    const inputB = screen.getByPlaceholderText("Senha B") as HTMLInputElement;
    const toggles = screen.getAllByLabelText("Mostrar senha");

    fireEvent.click(toggles[0]);
    expect(inputA.type).toBe("text");
    expect(inputB.type).toBe("password");
  });

  it("toggle não é focável via Tab (tabIndex=-1)", () => {
    render(<PasswordInput placeholder="Senha" />);
    expect(screen.getByLabelText("Mostrar senha")).toHaveAttribute("tabindex", "-1");
  });
});
