import React, { createContext, useContext, useState, useCallback } from "react";
import { SFX } from "../utils/shooting_sfx";

interface DialogOptions {
  title: string;
  description: string;
  confirmButton?: string;
  cancelButton?: string;
  alertButton?: string;
  sound?: 'chat' | 'urgent' | 'consume';
}

interface DialogContextType {
  openAlert: (options: DialogOptions) => Promise<void>;
  openConfirm: (options: DialogOptions) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | null>(null);

export function useDialog(): DialogContextType {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<DialogOptions | null>(null);
  const [resolveRef, setResolveRef] = useState<((value: any) => void) | null>(null);
  const [isConfirm, setIsConfirm] = useState(false);

  const openAlert = useCallback((opts: DialogOptions) => {
    setOptions(opts);
    setIsConfirm(false);
    setIsOpen(true);
    
    // 알림음 재생
    if (opts.sound === 'chat') SFX.playChatAlert();
    else if (opts.sound === 'urgent') SFX.playUrgentAlert();
    else if (opts.sound === 'consume') SFX.playConsumeAlert();

    return new Promise<void>((resolve) => {
      setResolveRef(() => resolve);
    });
  }, []);

  const openConfirm = useCallback((opts: DialogOptions) => {
    setOptions(opts);
    setIsConfirm(true);
    setIsOpen(true);

    // 알림음 재생
    if (opts.sound === 'chat') SFX.playChatAlert();
    else if (opts.sound === 'urgent') SFX.playUrgentAlert();
    else if (opts.sound === 'consume') SFX.playConsumeAlert();

    return new Promise<boolean>((resolve) => {
      setResolveRef(() => resolve);
    });
  }, []);

  const handleClose = (value: boolean) => {
    setIsOpen(false);
    if (resolveRef) {
      resolveRef(value);
    }
  };

  return (
    <DialogContext.Provider value={{ openAlert, openConfirm }}>
      {children}
      {isOpen && options && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 99999, padding: "24px"
        }}>
          <div className="dialog-modal-card" style={{
            width: "100%", maxWidth: "320px",
            backgroundColor: "var(--bg-card)",
            borderRadius: "24px", padding: "24px",
            boxShadow: "0 12px 36px rgba(0,0,0,0.4)",
            textAlign: "center", display: "flex", flexDirection: "column", gap: "16px",
            border: "1px solid var(--border-primary)",
            animation: "scaleUp 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
          }}>
            <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: 0, color: "var(--text-primary)" }}>{options.title}</h3>
            <p style={{ fontSize: "15px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.5", whiteSpace: "pre-wrap" }}>{options.description}</p>
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              {isConfirm ? (
                <>
                  <button
                    onClick={() => handleClose(false)}
                    style={{
                      flex: 1, height: "48px", backgroundColor: "var(--bg-inner)",
                      color: "var(--text-secondary)", border: "none", borderRadius: "12px",
                      fontSize: "14px", fontWeight: "bold", cursor: "pointer"
                    }}
                  >
                    {options.cancelButton || "취소"}
                  </button>
                  <button
                    onClick={() => handleClose(true)}
                    style={{
                      flex: 1, height: "48px", backgroundColor: "var(--point-blue, #3182F6)",
                      color: "#FFFFFF", border: "none", borderRadius: "12px",
                      fontSize: "14px", fontWeight: "bold", cursor: "pointer"
                    }}
                  >
                    {options.confirmButton || "확인"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleClose(true)}
                  style={{
                    width: "100%", height: "48px", backgroundColor: "var(--point-blue, #3182F6)",
                    color: "#FFFFFF", border: "none", borderRadius: "12px",
                    fontSize: "14px", fontWeight: "bold", cursor: "pointer"
                  }}
                >
                  {options.alertButton || "확인"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
