import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type QuestionType = 'short_text' | 'long_text' | 'dropdown' | 'checkbox';

interface SurveyQuestion {
  id: string;
  question_text: string;
  question_type: QuestionType;
  options: string[];
  is_required: boolean;
}

interface CSVSurveyQuestionUploadProps {
  onQuestionsImported: (questions: SurveyQuestion[]) => void;
}

const CSVSurveyQuestionUpload = ({ onQuestionsImported }: CSVSurveyQuestionUploadProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parseResult, setParseResult] = useState<{ success: number; errors: string[] } | null>(null);

  const downloadTemplate = () => {
    const headers = 'question_text,question_type,options,is_required';
    const example1 = '"What is your name?","short_text","",false';
    const example2 = '"Please describe your experience","long_text","",true';
    const example3 = '"How satisfied are you?","dropdown","Very Satisfied|Satisfied|Neutral|Dissatisfied",true';
    const example4 = '"Select all that apply","checkbox","Option A|Option B|Option C",false';
    const csvContent = `${headers}\n${example1}\n${example2}\n${example3}\n${example4}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'survey_questions_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): SurveyQuestion[] => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length < 2) {
      throw new Error('CSV must have a header row and at least one data row');
    }

    const header = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
    const requiredFields = ['question_text', 'question_type'];
    
    for (const field of requiredFields) {
      if (!header.includes(field)) {
        throw new Error(`Missing required column: ${field}`);
      }
    }

    const questions: SurveyQuestion[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);
        const row: Record<string, string> = {};
        
        header.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });

        // Validate question_type
        const rawType = (row.question_type ?? '').trim().toLowerCase();
        const validTypes: QuestionType[] = ['short_text', 'long_text', 'dropdown', 'checkbox'];
        
        if (!validTypes.includes(rawType as QuestionType)) {
          errors.push(
            `Row ${i + 1}: Invalid question_type "${row.question_type}" (use short_text, long_text, dropdown, or checkbox)`
          );
          continue;
        }

        const questionType = rawType as QuestionType;

        // Validate required fields
        if (!row.question_text?.trim()) {
          errors.push(`Row ${i + 1}: Missing question_text`);
          continue;
        }

        // Parse options (separated by pipe |)
        let options: string[] = [];
        if (questionType === 'dropdown' || questionType === 'checkbox') {
          const optionsStr = row.options?.trim() || '';
          if (optionsStr) {
            options = optionsStr.split('|').map(o => o.trim()).filter(o => o);
          }
          if (options.length < 2) {
            options = ['Option 1', 'Option 2'];
          }
        }

        // Parse is_required
        const isRequiredStr = (row.is_required ?? '').trim().toLowerCase();
        const isRequired = isRequiredStr === 'true' || isRequiredStr === 'yes' || isRequiredStr === '1';

        questions.push({
          id: crypto.randomUUID(),
          question_text: row.question_text.trim(),
          question_type: questionType,
          options,
          is_required: isRequired,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to parse row';
        errors.push(`Row ${i + 1}: ${message}`);
      }
    }

    setParseResult({ success: questions.length, errors });
    return questions;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    
    return result;
  };

  const handleFile = (file: File) => {
    const isCSV = file.name.toLowerCase().endsWith('.csv') || 
                  file.type === 'text/csv' || 
                  file.type === 'application/vnd.ms-excel' ||
                  file.type === 'text/plain';
    
    if (!isCSV) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload a CSV file (.csv)',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let text = e.target?.result as string;
        
        text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        if (text.charCodeAt(0) === 0xFEFF) {
          text = text.slice(1);
        }
        
        const questions = parseCSV(text);
        
        if (questions.length === 0) {
          toast({
            variant: 'destructive',
            title: 'No valid questions found',
            description: 'Please check the CSV format and try again.',
          });
          return;
        }

        onQuestionsImported(questions);
        toast({
          title: 'Questions imported!',
          description: `Successfully imported ${questions.length} question(s)`,
        });
      } catch (error: any) {
        console.error('CSV parse error:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to parse CSV',
          description: error.message,
        });
      }
    };
    reader.onerror = () => {
      toast({
        variant: 'destructive',
        title: 'Failed to read file',
        description: 'Could not read the file. Please try again.',
      });
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Bulk Import from CSV
        </CardTitle>
        <CardDescription>
          Upload a CSV file to import multiple survey questions at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          )}
        >
          <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            Drop your CSV file here or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Supports .csv files with survey question data
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
          className="hidden"
        />

        <Button variant="outline" onClick={downloadTemplate} className="w-full">
          <Download className="h-4 w-4 mr-2" />
          Download CSV Template
        </Button>

        {parseResult && (
          <div className="space-y-2 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>{parseResult.success} question(s) imported successfully</span>
            </div>
            {parseResult.errors.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{parseResult.errors.length} error(s):</span>
                </div>
                <ul className="text-xs text-muted-foreground ml-6 list-disc">
                  {parseResult.errors.slice(0, 5).map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                  {parseResult.errors.length > 5 && (
                    <li>...and {parseResult.errors.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Required columns:</p>
          <p>question_text, question_type</p>
          <p className="font-medium mt-2">Optional columns:</p>
          <p>options (pipe-separated, e.g., "A|B|C"), is_required (true/false)</p>
          <p className="font-medium mt-2">Valid question types:</p>
          <p>short_text, long_text, dropdown, checkbox</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CSVSurveyQuestionUpload;
