"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Wrench, ScanLine, QrCode, Calculator, Scale, FileImage, FileText, FileArchive, Camera, UploadCloud, X, ArrowLeft, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';

declare global {
  interface Window {
    pdfjsLib: any;
    jspdf: any;
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const [calculatorInput, setCalculatorInput] = useState<string>("");
  const [unitFrom, setUnitFrom] = useState<string>('m');
  const [unitTo, setUnitTo] = useState<string>('ft');
  const [unitInputValue, setUnitInputValue] = useState<string>('1');
  const [unitOutputValue, setUnitOutputValue] = useState<string>('');

  // PDF to Image states
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [convertedImages, setConvertedImages] = useState<string[]>([]);
  const [isConvertingPdf, setIsConvertingPdf] = useState(false);
  const pdfJsWorkerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"; // Common CDN

  // Image to PDF states
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [isConvertingImages, setIsConvertingImages] = useState(false);
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null);


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
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = pdfJsWorkerSrc;
        }
      }).catch(console.error);
    }
    if (activeTool === 'imageToPdf' && !window.jspdf) {
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", "jspdf-script").catch(console.error);
    }
  }, [activeTool, loadScript, pdfJsWorkerSrc]);


  const openTool = (tool: ActiveTool) => {
    setActiveTool(tool);
    setCapturedImage(null);
    setPdfFile(null);
    setConvertedImages([]);
    setImageFiles(null);
    setPdfDownloadUrl(null);
    if (tool === 'documentScanner' || tool === 'qrCodeScanner') {
      requestCameraPermission();
    } else {
      stopCameraStream();
    }
  };

  const closeTool = () => {
    stopCameraStream();
    setActiveTool(null);
    setCalculatorInput("");
    setUnitFrom('m');
    setUnitTo('ft');
    setUnitInputValue('1');
    setUnitOutputValue('');
    setPdfFile(null);
    setConvertedImages([]);
    setImageFiles(null);
    setPdfDownloadUrl(null);
  };

  const requestCameraPermission = async () => {
    setHasCameraPermission(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setHasCameraPermission(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings.',
      });
    }
  };

  const stopCameraStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
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
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedImage(dataUrl);
        stopCameraStream();
      }
    }
  };

  const appendToCalculatorDisplay = (value: string) => setCalculatorInput(prev => prev + value);
  const clearCalculatorDisplay = () => setCalculatorInput("");
  const calculatorBackspace = () => setCalculatorInput(prev => prev.slice(0, -1));
  const calculateResult = () => {
    if (!calculatorInput) return;
    try {
      let expression = calculatorInput
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/\^/g, '**');
      const simpleSanitizeRegex = /^[0-9()+\-*/.^% Math.sqrtMath.sinMath.cosMath.tanMath.log10\s]+$/;
      if (!simpleSanitizeRegex.test(expression)) {
        setCalculatorInput('Invalid Input'); return;
      }
      // eslint-disable-next-line no-eval
      const result = eval(expression);
      setCalculatorInput(String(result));
    } catch (error) { setCalculatorInput('Error'); }
  };

  const unitConversionRates: Record<string, Record<string, number>> = {
    m: { ft: 3.28084, in: 39.3701, yd: 1.09361, km: 0.001, cm: 100, m: 1 },
    km: { ft: 3280.84, in: 39370.1, yd: 1093.61, m: 1000, cm: 100000, km: 1 },
    cm: { ft: 0.0328084, in: 0.393701, yd: 0.0109361, m: 0.01, km: 0.00001, cm: 1 },
    ft: { m: 0.3048, km: 0.0003048, cm: 30.48, in: 12, yd: 1 / 3, ft: 1 },
    in: { m: 0.0254, km: 0.0000254, cm: 2.54, ft: 1 / 12, yd: 1 / 36, in: 1 },
    yd: { m: 0.9144, km: 0.0009144, cm: 91.44, ft: 3, in: 36, yd: 1 },
  };
  const handleUnitConversion = () => {
    const val = parseFloat(unitInputValue);
    if (isNaN(val)) { setUnitOutputValue("Invalid Input"); return; }
    if (unitConversionRates[unitFrom] && unitConversionRates[unitFrom][unitTo]) {
      const rate = unitConversionRates[unitFrom][unitTo];
      setUnitOutputValue((val * rate).toFixed(4));
    } else { setUnitOutputValue("N/A"); }
  };

  const handlePdfToImageConvert = async () => {
    if (!pdfFile) {
      toast({ title: "No PDF selected", description: "Please select a PDF file to convert.", variant: "destructive" });
      return;
    }
    if (!window.pdfjsLib) {
      toast({ title: "Library not loaded", description: "PDF.js library is not loaded yet. Please wait or try reloading.", variant: "destructive" });
      return;
    }
    setIsConvertingPdf(true);
    setConvertedImages([]);
    const fileReader = new FileReader();
    fileReader.onload = async function () {
      try {
        const typedarray = new Uint8Array(this.result as ArrayBuffer);
        const pdf = await window.pdfjsLib.getDocument(typedarray).promise;
        const numPages = pdf.numPages;
        const images: string[] = [];
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          const canvasContext = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          if (canvasContext) {
            await page.render({ canvasContext, viewport }).promise;
            images.push(canvas.toDataURL('image/png'));
          }
        }
        setConvertedImages(images);
        toast({ title: "Conversion Successful", description: `${numPages} page(s) converted to images.` });
      } catch (error) {
        console.error('Error converting PDF:', error);
        toast({ title: "Conversion Error", description: "Failed to convert PDF to images.", variant: "destructive" });
      } finally {
        setIsConvertingPdf(false);
      }
    };
    fileReader.readAsArrayBuffer(pdfFile);
  };

  const handleImageToPdfConvert = async () => {
    if (!imageFiles || imageFiles.length === 0) {
      toast({ title: "No Images Selected", description: "Please select one or more image files.", variant: "destructive" });
      return;
    }
    if (!window.jspdf) {
      toast({ title: "Library not loaded", description: "jsPDF library is not loaded yet. Please wait or try reloading.", variant: "destructive" });
      return;
    }
    setIsConvertingImages(true);
    setPdfDownloadUrl(null);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    let processedImages = 0;

    for (const file of Array.from(imageFiles)) {
      if (file.type.startsWith('image/')) {
        const fileReader = new FileReader();
        await new Promise<void>((resolve) => {
          fileReader.onload = function () {
            const imgData = this.result as string;
            const img = new Image();
            img.onload = function () {
              const pageWidth = pdf.internal.pageSize.getWidth();
              const pageHeight = pdf.internal.pageSize.getHeight();
              let width = img.width;
              let height = img.height;

              if (width > pageWidth - 20) { // 10 margin on each side
                height *= (pageWidth - 20) / width;
                width = pageWidth - 20;
              }
              if (height > pageHeight - 20) {
                width *= (pageHeight - 20) / height;
                height = pageHeight - 20;
              }
              const x = (pageWidth - width) / 2;
              const y = (pageHeight - height) / 2;

              if (processedImages > 0) pdf.addPage();
              pdf.addImage(imgData, 'JPEG', x, y, width, height);
              processedImages++;
              resolve();
            };
            img.src = imgData;
          };
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
    setIsConvertingImages(false);
  };


  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [activeTool]);

  const tools = [
    { id: 'documentScanner', title: "Document Scanner", description: "Scan documents using your device camera.", icon: <ScanLine />, action: () => openTool('documentScanner') },
    { id: 'imageToPdf', title: "Image to PDF", description: "Convert images to PDF files.", icon: <FileImage />, action: () => openTool('imageToPdf') },
    { id: 'pdfToImage', title: "PDF to Image", description: "Convert PDF pages to images.", icon: <FileText />, action: () => openTool('pdfToImage') },
    { id: 'fileCompression', title: "File Compression", description: "Compress files to reduce size (ZIP).", icon: <FileArchive />, action: () => openTool('fileCompression') },
    { id: 'qrCodeScanner', title: "QR Code Scanner", description: "Scan QR codes using your camera.", icon: <QrCode />, action: () => openTool('qrCodeScanner') },
    { id: 'scientificCalculator', title: "Scientific Calculator", description: "Perform complex calculations.", icon: <Calculator />, action: () => openTool('scientificCalculator') },
    { id: 'unitConverter', title: "Unit Converter", description: "Convert various units of measurement.", icon: <Scale />, action: () => openTool('unitConverter') },
  ];

  const calculatorButtons = [
    ['7', '8', '9', '+'], ['4', '5', '6', '-'], ['1', '2', '3', '*'], ['0', '.', '=', '/'],
    ['C', '←', 'sin(', 'cos('], ['tan(', 'log(', 'sqrt(', '^']
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
            <ToolCard
              key={tool.id} title={tool.title} description={tool.description}
              icon={tool.icon} actionText="Open Tool" onAction={tool.action}
            />
          ))}
        </div>
      )}

      {activeTool && (
        <Card className="w-full shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {tools.find(t => t.id === activeTool)?.icon}
              {tools.find(t => t.id === activeTool)?.title}
            </CardTitle>
            <CardDescription>{tools.find(t => t.id === activeTool)?.description}</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[300px]">
            {activeTool === 'documentScanner' && (
              <div className="space-y-4">
                {!capturedImage && hasCameraPermission === null && <SimpleRotatingSpinner className="mx-auto h-10 w-10 text-primary" />}
                <video ref={videoRef} className={`w-full aspect-video rounded-md border bg-muted ${capturedImage || hasCameraPermission === false || hasCameraPermission === null ? 'hidden' : ''}`} autoPlay muted playsInline />
                {!capturedImage && hasCameraPermission === false && <Alert variant="destructive"><AlertTitle>Camera Access Denied</AlertTitle><AlertDescription>Please enable camera permissions.</AlertDescription></Alert>}
                {!capturedImage && hasCameraPermission === true && (
                  <Button onClick={handleCaptureImage} className="w-full"><Camera className="mr-2 h-4 w-4" />Capture Image</Button>
                )}
                <canvas ref={canvasRef} className="hidden"></canvas>
                {capturedImage && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Captured Image:</h3>
                    <img src={capturedImage} alt="Scanned document" className="rounded-md border max-w-full h-auto" data-ai-hint="document scan" />
                    <Button onClick={() => { setCapturedImage(null); requestCameraPermission(); }} variant="outline" className="w-full">Scan Another</Button>
                    <Button onClick={() => toast({ title: "Save as PDF (Coming Soon)", description: "Functionality to save as PDF will be added." })} className="w-full">
                      Save as PDF (Coming Soon)
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTool === 'imageToPdf' && (
              <div className="space-y-4 text-center">
                <Input type="file" accept="image/*" multiple onChange={(e) => setImageFiles(e.target.files)} className="mx-auto max-w-sm" />
                <Button onClick={handleImageToPdfConvert} disabled={isConvertingImages || !imageFiles || imageFiles.length === 0}>
                  {isConvertingImages ? <SimpleRotatingSpinner className="mr-2 h-4 w-4" /> : <FileImage className="mr-2 h-4 w-4" />}
                  {isConvertingImages ? "Converting..." : "Convert to PDF"}
                </Button>
                {pdfDownloadUrl && (
                  <a href={pdfDownloadUrl} download="images.pdf" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
                    <Download className="mr-2 h-4 w-4" /> Download PDF
                  </a>
                )}
                 <p className="text-sm text-muted-foreground mt-2">Upload one or more images to combine into a single PDF.</p>
              </div>
            )}

            {activeTool === 'pdfToImage' && (
              <div className="space-y-4">
                <Input type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files ? e.target.files[0] : null)} className="mx-auto max-w-sm block" />
                <Button onClick={handlePdfToImageConvert} disabled={isConvertingPdf || !pdfFile} className="w-full sm:w-auto mx-auto block">
                  {isConvertingPdf ? <SimpleRotatingSpinner className="mr-2 h-4 w-4" /> : <FileText className="mr-2 h-4 w-4" />}
                  {isConvertingPdf ? "Converting..." : "Convert PDF to Images"}
                </Button>
                {convertedImages.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h3 className="font-semibold text-center">Converted Images:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {convertedImages.map((imgDataUrl, index) => (
                        <img key={index} src={imgDataUrl} alt={`Page ${index + 1}`} className="rounded-md border shadow-sm max-w-full h-auto" data-ai-hint="document page" />
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-sm text-muted-foreground text-center mt-2">Upload a PDF file to convert its pages into images.</p>
              </div>
            )}

            {activeTool === 'fileCompression' && (
              <div className="space-y-4 text-center">
                <Input type="file" multiple className="mx-auto max-w-sm" />
                <Button disabled>Compress Files (Coming Soon)</Button>
                <p className="text-sm text-muted-foreground">This feature will allow you to compress multiple files into a ZIP archive.</p>
              </div>
            )}

            {activeTool === 'qrCodeScanner' && (
              <div className="space-y-4">
                {hasCameraPermission === null && <SimpleRotatingSpinner className="mx-auto h-10 w-10 text-primary" />}
                <video ref={videoRef} className={`w-full aspect-video rounded-md border bg-muted ${hasCameraPermission === false || hasCameraPermission === null ? 'hidden' : ''}`} autoPlay muted playsInline />
                {hasCameraPermission === false && <Alert variant="destructive"><AlertTitle>Camera Access Denied</AlertTitle><AlertDescription>Please enable camera permissions to use the QR scanner.</AlertDescription></Alert>}
                {hasCameraPermission === true && (
                  <p className="text-sm text-muted-foreground text-center">Point your camera at a QR code. Scanning functionality coming soon.</p>
                )}
              </div>
            )}

            {activeTool === 'scientificCalculator' && (
              <div className="w-full max-w-xs mx-auto border border-border p-2.5 rounded-lg bg-card text-card-foreground">
                <Input
                  type="text" readOnly value={calculatorInput}
                  className="w-full mb-2.5 p-2.5 text-xl text-right bg-background border border-input rounded-md h-12" placeholder="0"
                />
                <div className="grid grid-cols-4 gap-1.25">
                  {calculatorButtons.flat().map((btn, index) => {
                    let action: () => void; let displayValue = btn;
                    if (btn === '=') action = calculateResult;
                    else if (btn === 'C') action = clearCalculatorDisplay;
                    else if (btn === '←') action = calculatorBackspace;
                    else if (btn === 'sqrt(') { action = () => appendToCalculatorDisplay('sqrt('); displayValue = '√'; }
                    else action = () => appendToCalculatorDisplay(btn);
                    return (
                      <Button key={index} variant="outline" className="p-2.5 text-base aspect-square flex items-center justify-center" onClick={action}>
                        {displayValue}
                      </Button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">Note: `eval()` is used for calculation, use with caution.</p>
              </div>
            )}

            {activeTool === 'unitConverter' && (
              <div className="w-full max-w-md mx-auto p-4 border border-border rounded-lg bg-card text-card-foreground space-y-4">
                <div>
                  <label htmlFor="fromValue" className="block mb-1 text-sm font-medium text-muted-foreground">Value:</label>
                  <Input type="number" id="fromValue" value={unitInputValue} onChange={e => setUnitInputValue(e.target.value)} className="w-full p-2 border border-input rounded-md bg-background" />
                </div>
                <div>
                  <label htmlFor="fromUnit" className="block mb-1 text-sm font-medium text-muted-foreground">From:</label>
                  <Select value={unitFrom} onValueChange={setUnitFrom}>
                    <SelectTrigger id="fromUnit" className="w-full p-2 border border-input rounded-md bg-background"><SelectValue placeholder="Select unit" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="m">Meters</SelectItem> <SelectItem value="km">Kilometers</SelectItem> <SelectItem value="cm">Centimeters</SelectItem>
                      <SelectItem value="ft">Feet</SelectItem> <SelectItem value="in">Inches</SelectItem> <SelectItem value="yd">Yards</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="toUnit" className="block mb-1 text-sm font-medium text-muted-foreground">To:</label>
                  <Select value={unitTo} onValueChange={setUnitTo}>
                    <SelectTrigger id="toUnit" className="w-full p-2 border border-input rounded-md bg-background"><SelectValue placeholder="Select unit" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="m">Meters</SelectItem> <SelectItem value="km">Kilometers</SelectItem> <SelectItem value="cm">Centimeters</SelectItem>
                      <SelectItem value="ft">Feet</SelectItem> <SelectItem value="in">Inches</SelectItem> <SelectItem value="yd">Yards</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleUnitConversion} className="w-full">Convert</Button>
                <div className="mt-2 font-semibold text-center">Result: {unitOutputValue || ''}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
