import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import { Check, ChevronDown, Copy, RefreshCw } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  presetColors?: string[];
  showHexValue?: boolean;
  className?: string;
  label?: string;
  description?: string;
}

const DEFAULT_PRESET_COLORS = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
  '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
  '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
  '#ff5722', '#795548', '#9e9e9e', '#607d8b', '#000000',
];

export function ColorPicker({
  value,
  onChange,
  presetColors = DEFAULT_PRESET_COLORS,
  showHexValue = true,
  className = '',
  label,
  description,
}: ColorPickerProps) {
  const { toast } = useToast();
  const [localColor, setLocalColor] = useState(value || '#000000');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  // Ensure value is updated when the prop changes
  useEffect(() => {
    if (value && value !== localColor) {
      setLocalColor(value);
    }
  }, [value]);

  // Validate and format hex color
  const validateColor = (color: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  };

  const formatColor = (color: string): string => {
    // Remove any non-hex characters
    let formatted = color.replace(/[^A-Fa-f0-9]/g, '');
    
    // Ensure it's a 6-character hex
    if (formatted.length === 3) {
      // Convert 3-char hex to 6-char (e.g., #abc to #aabbcc)
      formatted = formatted
        .split('')
        .map(c => c + c)
        .join('');
    } else if (formatted.length > 6) {
      formatted = formatted.substring(0, 6);
    } else if (formatted.length < 6) {
      // Pad with zeros if less than 6 characters
      formatted = formatted.padEnd(6, '0');
    }
    
    return `#${formatted}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    
    if (newColor.startsWith('#')) {
      setLocalColor(newColor);
    } else {
      setLocalColor(`#${newColor}`);
    }
  };

  const handleBlur = () => {
    if (validateColor(localColor)) {
      onChange(localColor);
    } else {
      // If invalid, format it or revert to the previous valid color
      const formattedColor = formatColor(localColor);
      setLocalColor(formattedColor);
      onChange(formattedColor);
    }
  };

  const handlePresetClick = (presetColor: string) => {
    setLocalColor(presetColor);
    onChange(presetColor);
    setIsPopoverOpen(false);
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setLocalColor(newColor);
    onChange(newColor);
  };

  const generateRandomColor = () => {
    const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    setLocalColor(randomColor);
    onChange(randomColor);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(localColor).then(() => {
      setCopiedToClipboard(true);
      toast({
        title: "Color copied",
        description: `${localColor} has been copied to clipboard`,
      });
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedToClipboard(false);
      }, 2000);
    });
  };

  const isValidColor = validateColor(localColor);
  const colorPreviewStyle = {
    backgroundColor: isValidColor ? localColor : '#cccccc',
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label>{label}</Label>}
      {description && <p className="text-sm text-muted-foreground mb-2">{description}</p>}
      
      <div className="flex space-x-2">
        <div 
          className="h-10 w-10 rounded-md border border-input flex-shrink-0"
          style={colorPreviewStyle}
        />

        <div className="flex-grow relative">
          <Input 
            value={localColor}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className={`${!isValidColor ? 'border-red-500' : ''}`}
            placeholder="#000000"
          />
          {!isValidColor && (
            <p className="text-xs text-red-500 mt-1">Please enter a valid hex color</p>
          )}
        </div>

        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3">
            <div className="space-y-3">
              <div>
                <Label>Color Picker</Label>
                <div className="mt-2">
                  <input
                    type="color"
                    value={localColor}
                    onChange={handleColorPickerChange}
                    className="w-full h-10 p-0 border-0 rounded-md cursor-pointer"
                  />
                </div>
              </div>
              
              <div>
                <Label>Presets</Label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {presetColors.map((color, index) => (
                    <Button
                      key={`${color}-${index}`}
                      type="button"
                      variant="outline"
                      className="w-full h-8 p-0 m-0 border"
                      onClick={() => handlePresetClick(color)}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>
              
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full"
                onClick={generateRandomColor}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Random Color
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Button 
          variant="outline" 
          size="icon" 
          onClick={copyToClipboard}
          title="Copy color code"
        >
          {copiedToClipboard ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
} 