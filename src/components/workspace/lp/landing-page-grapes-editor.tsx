"use client";

import type { Editor } from "grapesjs";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { buildLandingPageInitialMarkup } from "@/lib/lp/templates";
import type { LandingPageDraft, LandingPageProjectData } from "@/lib/lp/types";

type LandingPageGrapesEditorProps = {
  page: LandingPageDraft;
  onProjectChange: (payload: {
    projectData: LandingPageProjectData;
    renderedHtml: string;
    renderedCss: string;
  }) => void;
};

export type LandingPageGrapesEditorHandle = {
  setDevice: (device: "Desktop" | "Mobile") => void;
  copyHtml: () => Promise<void>;
  resetTemplate: () => void;
};

export const LandingPageGrapesEditor = forwardRef<
  LandingPageGrapesEditorHandle,
  LandingPageGrapesEditorProps
>(function LandingPageGrapesEditor({ page, onProjectChange }, ref) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const onProjectChangeRef = useRef(onProjectChange);
  const pageRef = useRef(page);
  const saveTimeoutRef = useRef<number | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    onProjectChangeRef.current = onProjectChange;
  }, [onProjectChange]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    let isMounted = true;

    async function mountEditor() {
      if (!containerRef.current) {
        return;
      }

      const grapesjs = (await import("grapesjs")).default;

      if (!isMounted || !containerRef.current) {
        return;
      }

      const currentPage = pageRef.current;

      const editor = grapesjs.init({
        container: containerRef.current,
        height: "78vh",
        width: "auto",
        storageManager: false,
        fromElement: false,
        projectData: currentPage.projectData ?? undefined,
        components: currentPage.projectData
          ? undefined
          : buildLandingPageInitialMarkup(currentPage),
        blockManager: {
          blocks: [
            {
              id: "hero-section",
              label: "Hero",
              category: "Secoes",
              content:
                '<section style="padding: 72px 24px;"><div style="max-width:1120px;margin:0 auto;"><h1 style="font-size:56px;line-height:1;margin:0 0 16px;">Sua headline principal</h1><p style="font-size:18px;line-height:1.7;color:rgba(17,17,26,.72);max-width:720px;">Descreva a promessa principal da LP.</p></div></section>',
            },
            {
              id: "capture-card",
              label: "Captura",
              category: "Secoes",
              content:
                '<section style="padding: 24px;"><div style="max-width:560px;margin:0 auto;border:1px solid rgba(17,17,26,.08);background:white;border-radius:28px;padding:28px;"><h3 style="font-size:24px;margin:0;">Receba o material</h3><p style="font-size:16px;line-height:1.7;color:rgba(17,17,26,.68);margin:12px 0 0;">Bloco de captura para nome, email e WhatsApp.</p><div style="display:grid;gap:12px;margin-top:20px;"><input placeholder="Seu nome" style="height:48px;border-radius:16px;border:1px solid rgba(17,17,26,.1);padding:0 14px;" /><input placeholder="Seu melhor email" style="height:48px;border-radius:16px;border:1px solid rgba(17,17,26,.1);padding:0 14px;" /><input placeholder="Seu WhatsApp" style="height:48px;border-radius:16px;border:1px solid rgba(17,17,26,.1);padding:0 14px;" /><button style="height:50px;border-radius:18px;border:none;background:#11111a;color:white;font-weight:600;">Quero acessar</button></div></div></section>',
            },
            {
              id: "benefits-grid",
              label: "Beneficios",
              category: "Secoes",
              content:
                '<section style="padding:24px;"><div style="max-width:1120px;margin:0 auto;display:grid;gap:16px;grid-template-columns:repeat(3,minmax(0,1fr));"><div style="border:1px solid rgba(17,17,26,.08);background:white;border-radius:24px;padding:24px;"><h3 style="margin:0 0 10px;">Beneficio 1</h3><p style="margin:0;color:rgba(17,17,26,.68);line-height:1.7;">Explique o primeiro ponto de valor.</p></div><div style="border:1px solid rgba(17,17,26,.08);background:white;border-radius:24px;padding:24px;"><h3 style="margin:0 0 10px;">Beneficio 2</h3><p style="margin:0;color:rgba(17,17,26,.68);line-height:1.7;">Explique o segundo ponto de valor.</p></div><div style="border:1px solid rgba(17,17,26,.08);background:white;border-radius:24px;padding:24px;"><h3 style="margin:0 0 10px;">Beneficio 3</h3><p style="margin:0;color:rgba(17,17,26,.68);line-height:1.7;">Explique o terceiro ponto de valor.</p></div></div></section>',
            },
            {
              id: "text",
              label: "Texto",
              category: "Basico",
              content:
                '<div data-gjs-type="text" style="padding:10px;font-size:16px;">Edite este texto</div>',
            },
            {
              id: "button",
              label: "Botao",
              category: "Basico",
              content:
                '<a href="#" style="display:inline-flex;align-items:center;justify-content:center;padding:14px 22px;border-radius:999px;background:#11111a;color:white;text-decoration:none;font-weight:600;">CTA</a>',
            },
            {
              id: "image",
              label: "Imagem",
              category: "Basico",
              select: true,
              activate: true,
              content: { type: "image" },
            },
          ],
        },
        deviceManager: {
          devices: [
            { id: "desktop", name: "Desktop", width: "" },
            {
              id: "mobile",
              name: "Mobile",
              width: "375px",
              widthMedia: "480px",
            },
          ],
        },
      });

      editorRef.current = editor;
      setIsReady(true);

      if (!currentPage.projectData) {
        onProjectChangeRef.current({
          projectData: editor.getProjectData(),
          renderedHtml: editor.getHtml() ?? "",
          renderedCss: editor.getCss() ?? "",
        });
      }

      editor.on("update", () => {
        if (saveTimeoutRef.current) {
          window.clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = window.setTimeout(() => {
          onProjectChangeRef.current({
            projectData: editor.getProjectData(),
            renderedHtml: editor.getHtml() ?? "",
            renderedCss: editor.getCss() ?? "",
          });
        }, 450);
      });
    }

    void mountEditor();

    return () => {
      isMounted = false;
      setIsReady(false);
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, []);

  const handleResetTemplate = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    editor.setComponents(buildLandingPageInitialMarkup(page));
    editor.setStyle("");
    onProjectChange({
      projectData: editor.getProjectData(),
      renderedHtml: editor.getHtml() ?? "",
      renderedCss: editor.getCss() ?? "",
    });
    toast.success("Template base reaplicado.");
  }, [onProjectChange, page]);

  const handleCopyHtml = useCallback(async () => {
    const editor = editorRef.current;
    const html = editor ? editor.getHtml() : page.renderedHtml;
    const css = editor ? editor.getCss() : page.renderedCss;

    if (!html) {
      toast.error("Ainda nao ha HTML para copiar.");
      return;
    }

    try {
      await navigator.clipboard.writeText(
        `<style>${css ?? ""}</style>\n${html}`,
      );
      toast.success("HTML exportado copiado.");
    } catch {
      toast.error("Nao foi possivel copiar o HTML.");
    }
  }, [page.renderedCss, page.renderedHtml]);

  const setDevice = useCallback((device: "Desktop" | "Mobile") => {
    editorRef.current?.setDevice(device);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      setDevice,
      copyHtml: handleCopyHtml,
      resetTemplate: handleResetTemplate,
    }),
    [handleCopyHtml, handleResetTemplate, setDevice],
  );

  return (
    <div className="overflow-hidden border border-border/70 bg-card/85 shadow-sm">
      {!isReady ? (
        <div className="flex min-h-[78vh] items-center justify-center text-sm text-muted-foreground">
          Carregando editor visual...
        </div>
      ) : null}
      <div
        ref={containerRef}
        className={isReady ? "min-h-[78vh]" : "hidden min-h-[78vh]"}
      />
    </div>
  );
});
