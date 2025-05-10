
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Wrench, ScanLine, QrCode, Calculator, Scale, FileImage, FileText, FileArchive, Camera, UploadCloud, X, ArrowLeft, Download, Maximize, Compress } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';

declare global {
  interface Window {
    pdfjsLib: any;
    jspdf: any;
    JSZip: any; // For jszip library
    QrScanner: any; // For qrcode-scanner library
  }
}

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  actionText: string;
  onAction: () => void;
  disabled?: boolean;
}

function ToolCard({ title, description, icon, actionText, onAction, disabled }: ToolCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out flex flex-col rounded-xl border bg-card border-border/70 hover:border-primary/50">
      <CardHeader className="pb-4 pt-5 px-5">
        <div className="flex items-start space-x-4">
          <div className="p-3 rounded-full bg-accent/10 dark:bg-accent/20">
            {React.cloneElement(icon as React.ReactElement, { className: "h-10 w-10 text-accent" })}
          </div>
          <div>
            <CardTitle className="text-lg sm:text-xl font-semibold text-foreground">{title}</CardTitle>
            <CardDescription className="text-sm mt-1 text-muted-foreground">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-end mt-auto px-5 pb-5">
        <Button onClick={onAction} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={disabled}>
          {actionText}
        </Button>
      </CardContent>
    </Card>
  );
}

type ActiveTool =
  | 'documentScanner'
  | 'imageToPdf'
  | 'pdfToImage'
  | 'fileCompression'
  | 'qrCodeScanner'
  | 'scientificCalculator'
  | 'unitConverter'
  | null;

export default function UsefulToolsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const qrVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [qrScannerInstance, setQrScannerInstance] = useState<any>(null);
  const [qrScanResult, setQrScanResult] = useState<string | null>(null);

  const [calculatorInput, setCalculatorInput] = useState<string>("");
  const [unitFrom, setUnitFrom] = useState<string>('m');
  const [unitTo, setUnitTo] = useState<string>('ft');
  const [unitInputValue, setUnitInputValue] = useState<string>('1');
  const [unitOutputValue, setUnitOutputValue] = useState<string>('');

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [convertedImages, setConvertedImages] = useState<string[]>([]);
  const [isConvertingPdf, setIsConvertingPdf] = useState(false);
  const pdfJsWorkerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  const [imageFilesToPdf, setImageFilesToPdf] = useState<FileList | null>(null);
  const [isConvertingImagesToPdf, setIsConvertingImagesToPdf] = useState(false);
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null);

  const [filesToZip, setFilesToZip] = useState<FileList | null>(null);
  const [zipFileToExtract, setZipFileToExtract] = useState<File | null>(null);
  const [extractedFiles, setExtractedFiles] = useState<{ name: string; url: string }[]>([]);
  const [isZipping, setIsZipping] = useState(false);
  const [isUnzipping, setIsUnzipping] = useState(false);

  const loadScript = useCallback((src: string, id: string, onLoad?: () => void) => {
    return new Promise<void>((resolve, reject) => {
      if (document.getElementById(id)) {
        onLoad?.();
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.id = id;
      script.async = true;
      script.onload = () => {
        onLoad?.();
        resolve();
      };
      script.onerror = () => {
        toast({ title: "Error", description: `Failed to load script: ${src}`, variant: "destructive" });
        reject(new Error(`Failed to load script ${src}`));
      };
      document.head.appendChild(script);
    });
  }, [toast]);

  useEffect(() => {
    if (activeTool === 'pdfToImage' && !window.pdfjsLib) {
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js", "pdfjs-script", () => {
        if (window.pdfjsLib) window.pdfjsLib.GlobalWorkerOptions.workerSrc = pdfJsWorkerSrc;
      }).catch(console.error);
    }
    if ((activeTool === 'imageToPdf' || activeTool === 'documentScanner') && !window.jspdf) {
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", "jspdf-script").catch(console.error);
    }
    if (activeTool === 'fileCompression' && !window.JSZip) {
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.umd.min.js", "jszip-script").catch(console.error);
    }
    if (activeTool === 'qrCodeScanner' && !window.QrScanner) {
      loadScript("https://cdn.jsdelivr.net/npm/qrcode-scanner@1.4.2/dist/qrcode-scanner.umd.min.js", "qrcode-scanner-script").catch(console.error);
    }
  }, [activeTool, loadScript, pdfJsWorkerSrc]);

  const openTool = (tool: ActiveTool) => {
    setActiveTool(tool);
    setCapturedImage(null);
    setPdfFile(null);
    setConvertedImages([]);
    setImageFilesToPdf(null);
    setPdfDownloadUrl(null);
    setFilesToZip(null);
    setZipFileToExtract(null);
    setExtractedFiles([]);
    setQrScanResult(null);

    if (tool === 'documentScanner') {
      requestCameraPermission(videoRef);
    } else if (tool === 'qrCodeScanner') {
      requestCameraPermission(qrVideoRef);
    } else {
      stopCameraStream();
    }
  };

  const closeTool = () => {
    stopCameraStream();
    if (qrScannerInstance) {
      qrScannerInstance.stop();
      setQrScannerInstance(null);
    }
    setActiveTool(null);
    setCalculatorInput("");
    setUnitFrom('m'); setUnitTo('ft'); setUnitInputValue('1'); setUnitOutputValue('');
    setPdfFile(null); setConvertedImages([]);
    setImageFilesToPdf(null); setPdfDownloadUrl(null);
    setFilesToZip(null); setZipFileToExtract(null); setExtractedFiles([]);
    setQrScanResult(null);
  };

  const requestCameraPermission = async (currentVideoRef: React.RefObject<HTMLVideoElement>) => {
    setHasCameraPermission(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(mediaStream);
      if (currentVideoRef.current) {
        currentVideoRef.current.srcObject = mediaStream;
      }
      setHasCameraPermission(true);
      if (activeTool === 'qrCodeScanner' && currentVideoRef.current && window.QrScanner) {
        const scanner = new window.QrScanner(
          currentVideoRef.current,
          (result: any) => {
            const data = result.data || result.text || result; // Try different properties
            setQrScanResult(data);
            toast({ title: "QR Code Scanned", description: `Data: ${data}` });
            if (scanner) scanner.stop(); 
            setQrScannerInstance(null);
            stopCameraStream();
          },
          { 
            highlightScanRegion: true, 
            highlightCodeOutline: true, 
            onDecodeError: (error: any) => { 
              if(!error.toString().toLowerCase().includes('no qr code found')) { 
                console.warn("QR Scan Error:", error); 
                // setQrScanResult("Error scanning QR code."); // Avoid setting error for no QR found
              } 
            } 
          }
        );
        setQrScannerInstance(scanner);
        scanner.start().catch((e: any) => { console.error("Failed to start QR scanner", e); setHasCameraPermission(false);});
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({ variant: 'destructive', title: 'Camera Access Denied', description: 'Please enable camera permissions.' });
    }
  };

  const stopCameraStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (qrVideoRef.current) qrVideoRef.current.srcObject = null;
    if (qrScannerInstance) {
      qrScannerInstance.stop();
      setQrScannerInstance(null);
    }
  };

  const handleCaptureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg'); // Use JPEG for smaller size
        setCapturedImage(dataUrl);
        stopCameraStream();
      }
    }
  };

  const saveCapturedImageAsPdf = () => {
    if (!capturedImage || !window.jspdf) {
        toast({ title: "Error", description: "No image captured or PDF library not loaded.", variant: "destructive"});
        return;
    }
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    const img = new Image();
    img.onload = function() {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        let width = img.width;
        let height = img.height;
        const ratio = width / height;
        
        if (width > pageWidth - 20) { width = pageWidth - 20; height = width / ratio; }
        if (height > pageHeight - 20) { height = pageHeight - 20; width = height * ratio; }

        const x = (pageWidth - width) / 2;
        const y = (pageHeight - height) / 2;
        pdf.addImage(capturedImage, 'JPEG', x, y, width, height);
        pdf.save('scanned_document.pdf');
        toast({ title: "Saved as PDF", description: "Scanned document saved as PDF."});
    }
    img.src = capturedImage;
  };

  const appendToCalculatorDisplay = (value: string) => setCalculatorInput(prev => prev + value);
  const clearCalculatorDisplay = () => setCalculatorInput("");
  const calculatorBackspace = () => setCalculatorInput(prev => prev.slice(0, -1));
  
  const calculateResult = () => {
    try {
      let evalInput = calculatorInput
        .replace(/sin\(/g, 'Math.sin(Math.PI/180 *') // Assuming degrees
        .replace(/cos\(/g, 'Math.cos(Math.PI/180 *') // Assuming degrees
        .replace(/tan\(/g, 'Math.tan(Math.PI/180 *') // Assuming degrees
        .replace(/log\(/g, 'Math.log10(')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/\^/g, '**');
      // eslint-disable-next-line no-eval
      const result = eval(evalInput);
      setCalculatorInput(String(result));
    } catch (error) {
      setCalculatorInput("Error");
    }
  };

  const unitConversionRates: Record<string, Record<string, number | ((val: number) => number)>> = {
    m: { ft: 3.28084, cm: 100, km: 0.001, in: 39.3701, yd: 1.09361 },
    km: { m: 1000, ft: 3280.84, mi: 0.621371 },
    cm: { m: 0.01, in: 0.393701 },
    ft: { m: 0.3048, in: 12, yd: 0.333333 },
    in: { cm: 2.54, ft: 0.0833333, m: 0.0254 },
    yd: { m: 0.9144, ft: 3 },
    kg: { lb: 2.20462, g: 1000 },
    lb: { kg: 0.453592, oz: 16 },
    g: { kg: 0.001, oz: 0.035274 },
    oz: { g: 28.3495, lb: 0.0625 },
    C: { F: (c: number) => (c * 9/5) + 32, K: (c: number) => c + 273.15 },
    F: { C: (f: number) => (f - 32) * 5/9, K: (f: number) => (f - 32) * 5/9 + 273.15 },
    K: { C: (k: number) => k - 273.15, F: (k: number) => (k - 273.15) * 9/5 + 32 },
  };

  const handleUnitConversion = () => {
    const fromValue = parseFloat(unitInputValue);
    if (isNaN(fromValue)) {
      setUnitOutputValue("Invalid input");
      return;
    }
    const conversionRule = unitConversionRates[unitFrom]?.[unitTo];
    if (typeof conversionRule === 'number') {
      setUnitOutputValue((fromValue * conversionRule).toFixed(4));
    } else if (typeof conversionRule === 'function') {
      setUnitOutputValue(conversionRule(fromValue).toFixed(4));
    } else {
      setUnitOutputValue("Conversion not supported");
    }
  };

  const handlePdfToImageConvert = async () => {
    if (!pdfFile) {
      toast({ title: "No PDF Selected", description: "Please select a PDF file to convert.", variant: "destructive" });
      return;
    }
    if (!window.pdfjsLib) {
      toast({ title: "Library not loaded", description: "pdf.js library is not loaded yet.", variant: "destructive" });
      return;
    }
    setIsConvertingPdf(true);
    setConvertedImages([]);
    try {
      const fileReader = new FileReader();
      fileReader.onload = async function() {
        try {
          const typedarray = new Uint8Array(this.result as ArrayBuffer);
          const pdf = await window.pdfjsLib.getDocument(typedarray).promise;
          const numPages = pdf.numPages;
          const tempImages: string[] = [];

          for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const canvasContext = canvas.getContext('2d');
            if (!canvasContext) {
              throw new Error("Failed to get canvas context");
            }
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext, viewport }).promise;
            tempImages.push(canvas.toDataURL('image/png'));
          }
          setConvertedImages(tempImages);
          toast({ title: "PDF Converted", description: `${numPages} page(s) converted to images.` });
        } catch (error: any) {
          console.error('Error converting PDF pages:', error);
          toast({ title: "PDF Conversion Error", description: error.message || "Failed to process PDF.", variant: "destructive" });
        } finally {
          setIsConvertingPdf(false);
        }
      };
      fileReader.readAsArrayBuffer(pdfFile);
    } catch (error: any) {
      console.error('Error reading PDF file:', error);
      toast({ title: "File Read Error", description: "Could not read the PDF file.", variant: "destructive" });
      setIsConvertingPdf(false);
    }
  };
  
  const handleImageToPdfConvert = async () => {
    if (!imageFilesToPdf || imageFilesToPdf.length === 0) {
        toast({ title: "No Images Selected", description: "Please select one or more image files.", variant: "destructive" });
        return;
    }
    if (!window.jspdf) {
        toast({ title: "Library not loaded", description: "jsPDF library is not loaded yet.", variant: "destructive" });
        return;
    }
    setIsConvertingImagesToPdf(true);
    setPdfDownloadUrl(null);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    let processedImages = 0;

    for (const file of Array.from(imageFilesToPdf)) {
        if (file.type.startsWith('image/')) {
        const fileReader = new FileReader();
        await new Promise<void>((resolve, reject) => { // Added reject
            fileReader.onload = function () {
            const imgData = this.result as string;
            const img = new Image();
            img.onload = function () {
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                let width = img.width; let height = img.height;
                const ratio = width / height;

                if (width > pageWidth - 20) { width = pageWidth - 20; height = width / ratio; }
                if (height > pageHeight - 20) { height = pageHeight - 20; width = height * ratio; }
                
                const x = (pageWidth - width) / 2; const y = (pageHeight - height) / 2;
                if (processedImages > 0) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', x, y, width, height); // Use JPEG for better compression
                processedImages++;
                resolve();
            };
            img.onerror = () => reject(new Error("Image load error")); // Added error handling for image load
            img.src = imgData;
            };
            fileReader.onerror = () => reject(new Error("File read error")); // Added error handling for file read
            fileReader.readAsDataURL(file);
        });
        }
    }
    if (processedImages > 0) {
        const pdfBlob = pdf.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        setPdfDownloadUrl(url);
        toast({ title: "PDF Generated", description: "Your PDF is ready for download." });
    } else {
        toast({ title: "No Images Processed", description: "No valid images were found to convert.", variant: "destructive" });
    }
    setIsConvertingImagesToPdf(false);
  };

  const createZipArchive = async () => {
    if (!filesToZip || filesToZip.length === 0) {
        toast({ title: "No files selected", description: "Please select files to compress.", variant: "destructive"});
        return;
    }
    if (!window.JSZip) {
        toast({ title: "Library not loaded", description: "JSZip library is not loaded.", variant: "destructive"});
        return;
    }
    setIsZipping(true);
    const zip = new window.JSZip();
    for (const file of Array.from(filesToZip)) {
        zip.file(file.name, await file.arrayBuffer());
    }
    try {
        const content = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 9 } });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = "archive.zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: "ZIP Created", description: "Archive.zip downloaded."});
    } catch (error) {
        console.error("Error creating ZIP:", error);
        toast({ title: "ZIP Creation Failed", variant: "destructive"});
    } finally {
        setIsZipping(false);
    }
  };

  const extractZipArchive = async () => {
    if (!zipFileToExtract) {
        toast({ title: "No ZIP file selected", description: "Please select a ZIP file to extract.", variant: "destructive"});
        return;
    }
    if (!window.JSZip) {
        toast({ title: "Library not loaded", description: "JSZip library is not loaded.", variant: "destructive"});
        return;
    }
    setIsUnzipping(true);
    setExtractedFiles([]);
    try {
        const zip = await window.JSZip.loadAsync(zipFileToExtract);
        const currentExtractedFiles: { name: string; url: string }[] = [];
        for (const [filename, file] of Object.entries(zip.files)) {
            if (!file.dir) {
                const content = await (file as any).async("blob");
                const url = URL.createObjectURL(content);
                currentExtractedFiles.push({ name: filename, url });
            }
        }
        setExtractedFiles(currentExtractedFiles);
        if (currentExtractedFiles.length > 0) {
            toast({ title: "ZIP Extracted", description: `${currentExtractedFiles.length} file(s) extracted.`});
        } else {
            toast({ title: "Empty ZIP", description: "The selected ZIP file is empty or contains only folders."});
        }
    } catch (error) {
        console.error("Error extracting ZIP:", error);
        toast({ title: "ZIP Extraction Failed", variant: "destructive"});
    } finally {
        setIsUnzipping(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
      if (qrScannerInstance) {
        qrScannerInstance.destroy?.() || qrScannerInstance.stop?.(); // Try destroy first
        setQrScannerInstance(null);
      }
    };
  }, [activeTool, qrScannerInstance]);

  const tools = [
    { id: 'documentScanner', title: "Document Scanner", description: "Scan documents using your device camera.", icon: <ScanLine />, action: () => openTool('documentScanner') },
    { id: 'imageToPdf', title: "Image to PDF", description: "Convert images to PDF files.", icon: <FileImage />, action: () => openTool('imageToPdf') },
    { id: 'pdfToImage', title: "PDF to Image", description: "Convert PDF pages to images.", icon: <FileText />, action: () => openTool('pdfToImage') },
    { id: 'fileCompression', title: "File Compression/Decompression", description: "Compress files to ZIP or extract ZIP archives.", icon: <FileArchive />, action: () => openTool('fileCompression') },
    { id: 'qrCodeScanner', title: "QR Code Scanner", description: "Scan QR codes using your camera.", icon: <QrCode />, action: () => openTool('qrCodeScanner') },
    { id: 'scientificCalculator', title: "Scientific Calculator", description: "Perform complex calculations.", icon: <Calculator />, action: () => openTool('scientificCalculator') },
    { id: 'unitConverter', title: "Unit Converter", description: "Convert various units of measurement.", icon: <Scale />, action: () => openTool('unitConverter') },
  ];

  const calculatorButtons = [
    '7', '8', '9', '/',
    '4', '5', '6', '*',
    '1', '2', '3', '-',
    '0', '.', '^', '+',
    'sin(', 'cos(', 'tan(', 'sqrt(',
    'log(', 'C', '←', '=',
  ];


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => activeTool ? closeTool() : router.back()} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center">
            <Wrench className="mr-3 h-7 w-7" /> Useful Tools
          </h1>
        </div>
      </div>

      {!activeTool && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map(tool => (
            <ToolCard key={tool.id} title={tool.title} description={tool.description} icon={tool.icon} actionText="Open Tool" onAction={tool.action} />
          ))}
        </div>
      )}

      {activeTool && (
        <Card className="w-full shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">{tools.find(t => t.id === activeTool)?.icon}{tools.find(t => t.id === activeTool)?.title}</CardTitle>
            <CardDescription>{tools.find(t => t.id === activeTool)?.description}</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[300px]">
            {activeTool === 'documentScanner' && (
              <div className="space-y-4">
                {!capturedImage && hasCameraPermission === null && <div className="flex justify-center py-4"><SimpleRotatingSpinner className="h-10 w-10 text-primary" /></div>}
                <video ref={videoRef} className={`w-full aspect-video rounded-md border bg-muted ${capturedImage || hasCameraPermission === false || hasCameraPermission === null ? 'hidden' : ''}`} autoPlay muted playsInline />
                {!capturedImage && hasCameraPermission === false && <Alert variant="destructive"><AlertTitle>Camera Access Denied</AlertTitle><AlertDescription>Please enable camera permissions in your browser settings to use this feature.</AlertDescription></Alert>}
                {!capturedImage && hasCameraPermission === true && <Button onClick={handleCaptureImage} className="w-full"><Camera className="mr-2 h-4 w-4" />Capture Image</Button>}
                <canvas ref={canvasRef} className="hidden"></canvas>
                {capturedImage && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-center">Captured Image Preview:</h3>
                    <img src={capturedImage} alt="Scanned document" className="rounded-md border max-w-full h-auto mx-auto shadow-md" data-ai-hint="document scan" />
                    <div className="flex flex-col sm:flex-row gap-2 mt-4">
                        <Button onClick={() => { setCapturedImage(null); requestCameraPermission(videoRef); }} variant="outline" className="flex-1">Scan Another</Button>
                        <Button onClick={saveCapturedImageAsPdf} className="flex-1" disabled={!window.jspdf}>Save as PDF</Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTool === 'imageToPdf' && (
              <div className="space-y-4 text-center">
                <label htmlFor="image-to-pdf-upload" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/75 transition-colors">
                    <UploadCloud className="w-10 h-10 mb-2 text-muted-foreground" />
                    <span className="mb-1 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag & drop</span>
                    <span className="text-xs text-muted-foreground">Images (PNG, JPG, GIF, WebP)</span>
                    <Input id="image-to-pdf-upload" type="file" accept="image/*" multiple onChange={(e) => setImageFilesToPdf(e.target.files)} className="sr-only" />
                </label>
                {imageFilesToPdf && imageFilesToPdf.length > 0 && <p className="text-sm text-muted-foreground">{imageFilesToPdf.length} image(s) selected.</p>}
                <Button onClick={handleImageToPdfConvert} disabled={isConvertingImagesToPdf || !imageFilesToPdf || imageFilesToPdf.length === 0 || !window.jspdf} className="w-full sm:w-auto">
                  {isConvertingImagesToPdf ? <SimpleRotatingSpinner className="mr-2 h-4 w-4" /> : <FileImage className="mr-2 h-4 w-4" />}
                  {isConvertingImagesToPdf ? "Converting..." : "Convert to PDF"}
                </Button>
                {pdfDownloadUrl && (
                  <a href={pdfDownloadUrl} download="images_converted.pdf" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
                    <Download className="mr-2 h-4 w-4" /> Download PDF
                  </a>
                )}
              </div>
            )}
            
            {activeTool === 'pdfToImage' && (
               <div className="space-y-4 text-center">
                 <label htmlFor="pdf-to-image-upload" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/75 transition-colors">
                    <UploadCloud className="w-10 h-10 mb-2 text-muted-foreground" />
                    <span className="mb-1 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag & drop</span>
                    <span className="text-xs text-muted-foreground">PDF file</span>
                    <Input id="pdf-to-image-upload" type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files ? e.target.files[0] : null)} className="sr-only" />
                 </label>
                {pdfFile && <p className="text-sm text-muted-foreground">{pdfFile.name} selected.</p>}
                <Button onClick={handlePdfToImageConvert} disabled={isConvertingPdf || !pdfFile || !window.pdfjsLib} className="w-full sm:w-auto">
                  {isConvertingPdf ? <SimpleRotatingSpinner className="mr-2 h-4 w-4" /> : <FileText className="mr-2 h-4 w-4" />}
                  {isConvertingPdf ? "Converting..." : "Convert PDF to Images"}
                </Button>
                {convertedImages.length > 0 && (
                  <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
                    <h3 className="font-semibold">Converted Images:</h3>
                    {convertedImages.map((imgData, index) => (
                      <img key={index} src={imgData} alt={`Page ${index + 1}`} className="rounded-md border max-w-xs h-auto mx-auto shadow-sm" data-ai-hint="pdf page" />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTool === 'fileCompression' && (
              <div className="space-y-6">
                <Card className="p-4">
                    <CardHeader className="p-0 pb-2"><CardTitle className="text-lg flex items-center"><Compress className="mr-2 h-5 w-5 text-primary"/> Compress to ZIP</CardTitle></CardHeader>
                    <CardContent className="p-0 pt-2">
                        <Input type="file" multiple onChange={(e) => setFilesToZip(e.target.files)} className="mb-3" />
                        <Button onClick={createZipArchive} disabled={isZipping || !filesToZip || filesToZip.length === 0 || !window.JSZip} className="w-full">
                            {isZipping ? <SimpleRotatingSpinner className="mr-2 h-4 w-4"/> : null} {isZipping ? "Zipping..." : "Create ZIP"}
                        </Button>
                    </CardContent>
                </Card>
                 <Card className="p-4">
                    <CardHeader className="p-0 pb-2"><CardTitle className="text-lg flex items-center"><Maximize className="mr-2 h-5 w-5 text-primary"/> Extract ZIP</CardTitle></CardHeader>
                    <CardContent className="p-0 pt-2">
                        <Input type="file" accept=".zip" onChange={(e) => setZipFileToExtract(e.target.files ? e.target.files[0] : null)} className="mb-3"/>
                        <Button onClick={extractZipArchive} disabled={isUnzipping || !zipFileToExtract || !window.JSZip} className="w-full">
                            {isUnzipping ? <SimpleRotatingSpinner className="mr-2 h-4 w-4"/> : null} {isUnzipping ? "Extracting..." : "Extract ZIP"}
                        </Button>
                        {extractedFiles.length > 0 && (
                            <div className="mt-4 space-y-1 max-h-40 overflow-y-auto border p-2 rounded-md bg-muted/30">
                                <h4 className="text-sm font-medium text-muted-foreground">Extracted Files:</h4>
                                {extractedFiles.map(file => (
                                    <a key={file.name} href={file.url} download={file.name} className="block text-xs text-primary hover:underline truncate">
                                        <Download className="inline h-3 w-3 mr-1"/>{file.name}
                                    </a>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
              </div>
            )}

            {activeTool === 'qrCodeScanner' && (
              <div className="space-y-4">
                {hasCameraPermission === null && <div className="flex justify-center py-4"><SimpleRotatingSpinner className="h-10 w-10 text-primary" /></div>}
                <video ref={qrVideoRef} className={`w-full max-w-md mx-auto aspect-square rounded-md border bg-muted ${hasCameraPermission === false || hasCameraPermission === null || qrScanResult ? 'hidden' : ''}`} autoPlay muted playsInline />
                {hasCameraPermission === false && <Alert variant="destructive"><AlertTitle>Camera Access Denied</AlertTitle><AlertDescription>Please enable camera permissions in your browser settings.</AlertDescription></Alert>}
                {qrScanResult && (
                    <Alert>
                        <QrCode className="h-4 w-4" />
                        <AlertTitle>QR Code Scanned!</AlertTitle>
                        <AlertDescription className="break-all">Data: {qrScanResult} <br />
                            <Button variant="link" size="sm" className="p-0 h-auto mt-1" onClick={() => {setQrScanResult(null); requestCameraPermission(qrVideoRef);}}>Scan Another</Button>
                        </AlertDescription>
                    </Alert>
                )}
                 {!qrScanResult && hasCameraPermission === true && <p className="text-center text-sm text-muted-foreground">Point your camera at a QR code.</p>}
              </div>
            )}

            {activeTool === 'scientificCalculator' && (
              <div className="space-y-3 max-w-xs mx-auto">
                <Input type="text" value={calculatorInput} readOnly className="text-right text-2xl h-16 bg-muted/50 rounded-md p-4 focus:ring-0 focus:border-input" placeholder="0"/>
                <div className="grid grid-cols-4 gap-2">
                  {calculatorButtons.map((btn) => (
                    <Button
                      key={btn}
                      onClick={() => {
                        if (btn === 'C') clearCalculatorDisplay();
                        else if (btn === '←') calculatorBackspace();
                        else if (btn === '=') calculateResult();
                        else appendToDisplay(btn);
                      }}
                      variant={['+', '-', '*', '/', '=', 'C', '←'].includes(btn) || btn.includes('(') ? "secondary" : "outline"}
                      className="text-lg p-3 sm:p-4 aspect-square shadow-sm hover:shadow-md transition-shadow"
                    >
                      {btn.replace(/\(/g, '')}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {activeTool === 'unitConverter' && (
              <div className="space-y-4 max-w-md mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <div>
                        <Label htmlFor="fromValue" className="text-sm">Value to Convert</Label>
                        <Input id="fromValue" type="number" value={unitInputValue} onChange={(e) => setUnitInputValue(e.target.value)} placeholder="Enter value" />
                    </div>
                     <div>
                        <Label htmlFor="fromUnit" className="text-sm">From Unit</Label>
                        <Select value={unitFrom} onValueChange={setUnitFrom}>
                            <SelectTrigger id="fromUnit"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {Object.keys(unitConversionRates).map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="flex justify-center items-center my-2">
                    <ArrowLeft className="h-5 w-5 text-muted-foreground transform rotate-90 sm:rotate-0"/>
                 </div>
                 <div>
                    <Label htmlFor="toUnit" className="text-sm">To Unit</Label>
                    <Select value={unitTo} onValueChange={setUnitTo}>
                        <SelectTrigger id="toUnit"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {Object.keys(unitConversionRates[unitFrom] || {}).map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}
                        </SelectContent>
                    </Select>
                 </div>
                <Button onClick={handleUnitConversion} className="w-full">Convert</Button>
                {unitOutputValue && (
                  <Alert className="mt-4">
                    <Scale className="h-4 w-4"/>
                    <AlertTitle>Conversion Result</AlertTitle>
                    <AlertDescription className="text-lg font-semibold">{unitOutputValue} {unitTo}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
