import React, { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { Dialog, DialogContent, IconButton, Box, CircularProgress, Typography } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { TRADE_NAMESPACE } from "../i18n";
import { Document, Page, pdfjs } from "react-pdf";
import { AppColors } from "../constant/appColors";
import guidePdf from "../assets/pdf/guide.pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

// Configure PDF.js worker (must be in same file as Document/Page usage).
// CDN avoids Vite worker path issues and works on mobile.
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * Full-screen modal that displays the PDF directly (canvas-based via react-pdf).
 * No browser "Open" prompt on mobile; PDF is viewable immediately in the modal.
 */
const PdfViewerModal = ({ open, onClose, src = guidePdf, title = "PDF" }) => {
  const { t } = useTranslation(TRADE_NAMESPACE);
  const [numPages, setNumPages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageWidth, setPageWidth] = useState(400);

  useLayoutEffect(() => {
    if (!open) return;
    const updateWidth = () => setPageWidth(Math.min(window.innerWidth - 24, 560));
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [open]);

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const onDocumentLoadSuccess = useCallback(({ numPages: n }) => {
    setNumPages(n);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((err) => {
    setError(err?.message || "Failed to load PDF");
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setNumPages(null);
  }, [open, src]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, handleClose]);

  if (!src) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: AppColors.BG_MAIN,
          maxHeight: "100dvh",
          "& .MuiDialogContent-root": { p: 0, overflow: "hidden" },
        },
      }}
      aria-label={title}
      aria-modal="true"
      disableScrollLock={false}
    >
      <DialogContent
        sx={{
          p: 0,
          overflow: "hidden",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          maxHeight: "100dvh",
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          paddingLeft: "env(safe-area-inset-left, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
        }}
      >
        <IconButton
          onClick={handleClose}
          aria-label={t("common.closeAriaLabel")}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 10,
            color: AppColors.TXT_MAIN,
            bgcolor: "rgba(0,0,0,0.5)",
            minWidth: 44,
            minHeight: 44,
            "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
            "&:active": { bgcolor: "rgba(0,0,0,0.8)" },
          }}
          size="large"
          touchRippleProps={{ center: true }}
        >
          <CloseIcon />
        </IconButton>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            pt: 6,
            pb: 2,
            px: 1,
            touchAction: "manipulation",
          }}
        >
          {loading && (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, minHeight: 200 }}>
              <CircularProgress sx={{ color: AppColors.TXT_MAIN }} />
            </Box>
          )}
          {error && (
            <Typography sx={{ color: AppColors.TXT_MAIN, textAlign: "center", py: 2 }}>{error}</Typography>
          )}
          <Document
            file={src}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
          >
            {numPages != null &&
              Array.from(new Array(numPages), (_, index) => (
                <Page
                  key={`page-${index + 1}`}
                  pageNumber={index + 1}
                  width={pageWidth}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              ))}
          </Document>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default PdfViewerModal;
