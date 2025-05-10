"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Wrench, ScanLine, QrCode, Calculator, Scale, FileImage, FileText, FileArchive, Camera, UploadCloud, X, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';

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

  // States for Scientific Calculator
  const [calculatorInput, setCalculatorInput] = useState<string>("");


  // States for Unit Converter - Updated based on new HTML
  const [unitFrom, setUnitFrom] = useState<string>('m'); // Default to meters
  const [unitTo, setUnitTo] = useState<string>('ft');   // Default to feet
  const [unitInputValue, setUnitInputValue] = useState<string>('1'); // Default value 1
  const [unitOutputValue, setUnitOutputValue] = useState<string>('');


  const openTool = (tool: ActiveTool) => {
    setActiveTool(tool);
    setCapturedImage(null); 
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
    setUnitFrom('m'); // Reset to new defaults
    setUnitTo('ft');
    setUnitInputValue('1');
    setUnitOutputValue('');
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
  
  // Scientific Calculator Functions
  const appendToCalculatorDisplay = (value: string) => {
    setCalculatorInput(prev => prev + value);
  };

  const clearCalculatorDisplay = () => {
    setCalculatorInput("");
  };

  const calculatorBackspace = () => {
    setCalculatorInput(prev => prev.slice(0, -1));
  };

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
        setCalculatorInput('Invalid Input');
        return;
      }
      
      // eslint-disable-next-line no-eval
      const result = eval(expression);
      setCalculatorInput(String(result));
    } catch (error) {
      setCalculatorInput('Error');
    }
  };

  // Updated unit conversion rates based on new HTML
  const unitConversionRates: Record<string, Record<string, number>> = {
    m: { ft: 3.28084, in: 39.3701, yd: 1.09361, km: 0.001, cm: 100, m: 1 },
    km: { ft: 3280.84, in: 39370.1, yd: 1093.61, m: 1000, cm: 100000, km: 1 },
    cm: { ft: 0.0328084, in: 0.393701, yd: 0.0109361, m: 0.01, km: 0.00001, cm: 1 },
    ft: { m: 0.3048, km: 0.0003048, cm: 30.48, in: 12, yd: 1/3, ft: 1 },
    in: { m: 0.0254, km: 0.0000254, cm: 2.54, ft: 1/12, yd: 1/36, in: 1 },
    yd: { m: 0.9144, km: 0.0009144, cm: 91.44, ft: 3, in: 36, yd: 1 },
  };

  const handleUnitConversion = () => {
    const val = parseFloat(unitInputValue);
    if (isNaN(val)) {
      setUnitOutputValue("Invalid Input");
      return;
    }

    if (unitConversionRates[unitFrom] && unitConversionRates[unitFrom][unitTo]) {
      const rate = unitConversionRates[unitFrom][unitTo];
      setUnitOutputValue((val * rate).toFixed(4)); // Using 4 decimal places for precision
    } else {
      setUnitOutputValue("N/A"); // Conversion not directly supported
    }
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
    ['7', '8', '9', '+'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '*'],
    ['0', '.', '=', '/'],
    ['C', '←', 'sin(', 'cos('],
    ['tan(', 'log(', 'sqrt(', '^']
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
              key={tool.id}
              title={tool.title}
              description={tool.description}
              icon={tool.icon}
              actionText="Open Tool"
              onAction={tool.action}
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
                    <img src={capturedImage} alt="Scanned document" className="rounded-md border max-w-full h-auto" />
                    <Button onClick={() => { setCapturedImage(null); requestCameraPermission(); }} variant="outline" className="w-full">Scan Another</Button>
                     <Button onClick={() => toast({title: "Save as PDF (Coming Soon)", description: "Functionality to save as PDF will be added."})} className="w-full">
                      Save as PDF (Coming Soon)
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTool === 'imageToPdf' && (
              <div className="space-y-4 text-center">
                <Input type="file" accept="image/*" className="mx-auto max-w-sm" />
                <Button disabled>Convert to PDF (Coming Soon)</Button>
                <p className="text-sm text-muted-foreground">This feature will allow you to upload an image and convert it to a PDF document.</p>
              </div>
            )}
            {activeTool === 'pdfToImage' && (
              <div className="space-y-4 text-center">
                <Input type="file" accept="application/pdf" className="mx-auto max-w-sm" />
                <Button disabled>Convert to Images (Coming Soon)</Button>
                 <p className="text-sm text-muted-foreground">This feature will allow you to upload a PDF and extract images from it.</p>
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
                  type="text" 
                  readOnly 
                  value={calculatorInput} 
                  className="w-full mb-2.5 p-2.5 text-xl text-right bg-background border border-input rounded-md h-12" 
                  placeholder="0"
                />
                <div className="grid grid-cols-4 gap-1.25">
                  {calculatorButtons.flat().map((btn, index) => {
                    let action: () => void;
                    let displayValue = btn;
                    if (btn === '=') {
                      action = calculateResult;
                    } else if (btn === 'C') {
                      action = clearCalculatorDisplay;
                    } else if (btn === '←') {
                      action = calculatorBackspace;
                    } else if (btn === 'sqrt(') {
                       action = () => appendToCalculatorDisplay('sqrt(');
                       displayValue = '√'; 
                    }
                     else {
                      action = () => appendToCalculatorDisplay(btn);
                    }
                    return (
                      <Button 
                        key={index} 
                        variant="outline"
                        className="p-2.5 text-base aspect-square flex items-center justify-center" 
                        onClick={action}
                      >
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
                          <SelectItem value="m">Meters</SelectItem>
                          <SelectItem value="km">Kilometers</SelectItem>
                          <SelectItem value="cm">Centimeters</SelectItem>
                          <SelectItem value="ft">Feet</SelectItem>
                          <SelectItem value="in">Inches</SelectItem>
                          <SelectItem value="yd">Yards</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 <div>
                    <label htmlFor="toUnit" className="block mb-1 text-sm font-medium text-muted-foreground">To:</label>
                     <Select value={unitTo} onValueChange={setUnitTo}>
                        <SelectTrigger id="toUnit" className="w-full p-2 border border-input rounded-md bg-background"><SelectValue placeholder="Select unit" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="m">Meters</SelectItem>
                          <SelectItem value="km">Kilometers</SelectItem>
                          <SelectItem value="cm">Centimeters</SelectItem>
                          <SelectItem value="ft">Feet</SelectItem>
                          <SelectItem value="in">Inches</SelectItem>
                          <SelectItem value="yd">Yards</SelectItem>
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
