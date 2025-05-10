
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


  // States for Unit Converter
  const [unitFrom, setUnitFrom] = useState<string>('meters');
  const [unitTo, setUnitTo] = useState<string>('feet');
  const [unitInputValue, setUnitInputValue] = useState<string>('');
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
    setUnitFrom('meters');
    setUnitTo('feet');
    setUnitInputValue('');
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
      // WARNING: Using eval() is generally unsafe and not recommended for production applications
      // due to security risks. This is a direct translation of the user's provided script.
      // A safer alternative would involve a proper math expression parser.
      let expression = calculatorInput
        .replace(/sin\(/g, 'Math.sin(') // Assumes radians for Math.sin, Math.cos, Math.tan
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/log\(/g, 'Math.log10(') // Assuming base 10 log. For natural log, use Math.log()
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/\^/g, '**'); // Power operator

      // A very basic check for potentially harmful characters - NOT a foolproof security measure.
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


  const unitConversionRates: Record<string, Record<string, number | ((val: number) => number)>> = {
    meters: { feet: 3.28084, kilometers: 0.001, miles: 0.000621371 },
    feet: { meters: 0.3048, kilometers: 0.0003048, miles: 0.000189394 },
    kilometers: { meters: 1000, feet: 3280.84, miles: 0.621371 },
    miles: { meters: 1609.34, feet: 5280, kilometers: 1.60934 },
    celsius: { fahrenheit: (c: number) => (c * 9/5) + 32, kelvin: (c: number) => c + 273.15 },
    fahrenheit: { celsius: (f: number) => (f - 32) * 5/9, kelvin: (f: number) => (f - 32) * 5/9 + 273.15 },
    kelvin: { celsius: (k: number) => k - 273.15, fahrenheit: (k: number) => (k - 273.15) * 9/5 + 32 },
  };

  const handleUnitConversion = () => {
    const val = parseFloat(unitInputValue);
    if (isNaN(val)) {
      setUnitOutputValue("Invalid Input");
      return;
    }
    const fromGroup = unitFrom.includes('meters') || unitFrom.includes('feet') || unitFrom.includes('kilometers') || unitFrom.includes('miles') ? 'length' : 'temp';
    const toGroup = unitTo.includes('meters') || unitTo.includes('feet') || unitTo.includes('kilometers') || unitTo.includes('miles') ? 'length' : 'temp';

    if (fromGroup !== toGroup) {
        setUnitOutputValue("Cannot convert between different types (e.g., length to temperature)");
        return;
    }

    if (unitConversionRates[unitFrom] && unitConversionRates[unitFrom][unitTo]) {
      const rateOrFn = unitConversionRates[unitFrom][unitTo];
      if (typeof rateOrFn === 'function') {
        setUnitOutputValue(rateOrFn(val).toFixed(2));
      } else {
        setUnitOutputValue((val * rateOrFn).toFixed(2));
      }
    } else if (unitFrom === unitTo) {
        setUnitOutputValue(val.toFixed(2));
    }
     else {
      setUnitOutputValue("Conversion not supported");
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
                {!capturedImage && hasCameraPermission === false && <Alert variant="destructive"><AlertTitle>Camera Access Denied</AlertTitle><AlertDescription>Please enable camera permissions.</AlertDescription></Alert>}
                {!capturedImage && hasCameraPermission === true && (
                  <>
                    <video ref={videoRef} className="w-full aspect-video rounded-md border bg-muted" autoPlay muted playsInline />
                    <Button onClick={handleCaptureImage} className="w-full"><Camera className="mr-2 h-4 w-4" />Capture Image</Button>
                  </>
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
                {hasCameraPermission === false && <Alert variant="destructive"><AlertTitle>Camera Access Denied</AlertTitle><AlertDescription>Please enable camera permissions to use the QR scanner.</AlertDescription></Alert>}
                {hasCameraPermission === true && (
                  <>
                    <video ref={videoRef} className="w-full aspect-video rounded-md border bg-muted" autoPlay muted playsInline />
                    <p className="text-sm text-muted-foreground text-center">Point your camera at a QR code. Scanning functionality coming soon.</p>
                  </>
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
                       displayValue = '√'; // Display √ symbol for sqrt(
                    }
                     else {
                      action = () => appendToCalculatorDisplay(btn);
                    }
                    return (
                      <Button 
                        key={index} 
                        variant="outline"
                        className="p-2.5 text-base aspect-square flex items-center justify-center" // Added aspect-square for better button look
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
               <div className="space-y-4 max-w-md mx-auto">
                 <div className="grid grid-cols-2 gap-4 items-end">
                    <div className="space-y-1">
                        <label htmlFor="unit-input-value" className="text-sm font-medium text-muted-foreground">Value</label>
                        <Input id="unit-input-value" type="number" value={unitInputValue} onChange={e => setUnitInputValue(e.target.value)} placeholder="Enter value" />
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="unit-from" className="text-sm font-medium text-muted-foreground">From</label>
                         <Select value={unitFrom} onValueChange={setUnitFrom}>
                            <SelectTrigger id="unit-from"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="meters">Meters (m)</SelectItem><SelectItem value="feet">Feet (ft)</SelectItem>
                                <SelectItem value="kilometers">Kilometers (km)</SelectItem><SelectItem value="miles">Miles (mi)</SelectItem>
                                <SelectItem value="celsius">Celsius (°C)</SelectItem><SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
                                <SelectItem value="kelvin">Kelvin (K)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4 items-end">
                     <div className="space-y-1">
                        <label htmlFor="unit-output-value" className="text-sm font-medium text-muted-foreground">Result</label>
                        <Input id="unit-output-value" type="text" value={unitOutputValue} readOnly placeholder="Converted value" className="bg-muted/70"/>
                    </div>
                    <div className="space-y-1">
                        <label htmlFor="unit-to" className="text-sm font-medium text-muted-foreground">To</label>
                        <Select value={unitTo} onValueChange={setUnitTo}>
                            <SelectTrigger id="unit-to"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="meters">Meters (m)</SelectItem><SelectItem value="feet">Feet (ft)</SelectItem>
                                <SelectItem value="kilometers">Kilometers (km)</SelectItem><SelectItem value="miles">Miles (mi)</SelectItem>
                                <SelectItem value="celsius">Celsius (°C)</SelectItem><SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
                                <SelectItem value="kelvin">Kelvin (K)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                 </div>
                 <Button onClick={handleUnitConversion} className="w-full">Convert</Button>
                 <p className="text-xs text-muted-foreground text-center">Basic length & temp converter. More units coming soon.</p>
               </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
