import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface CSVQuestionUploadProps {
  onQuestionsImported: (questions: Question[]) => void;
}

const CSVQuestionUpload = ({ onQuestionsImported }: CSVQuestionUploadProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parseResult, setParseResult] = useState<{ success: number; errors: string[] } | null>(null);

  const downloadTemplate = () => {
    const headers = 'question_text,option_a,option_b,option_c,option_d,correct_option,marks,difficulty';
    const example1 = '"What is 2 + 2?","3","4","5","6","B",1,easy';
    const example2 = '"What is the capital of France?","London","Paris","Berlin","Madrid","B",2,medium';
    const csvContent = `${headers}\n${example1}\n${example2}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz_questions_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): Question[] => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length < 2) {
      throw new Error('CSV must have a header row and at least one data row');
    }

    // Parse header
    const header = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
    const requiredFields = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option'];
    
    for (const field of requiredFields) {
      if (!header.includes(field)) {
        throw new Error(`Missing required column: ${field}`);
      }
    }

    const questions: Question[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);
        const row: Record<string, string> = {};
        
        header.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });

        // Validate correct_option (accepts A/B/C/D or option_a/option_b/option_c/option_d)
        const rawCorrectOption = (row.correct_option ?? '').toString();
        const normalizedCorrectOption = rawCorrectOption
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '')
          .replace(/[^a-z0-9]/g, '');

        const correctOptionMap: Record<string, 'A' | 'B' | 'C' | 'D'> = {
          a: 'A',
          optiona: 'A',
          '1': 'A',
          b: 'B',
          optionb: 'B',
          '2': 'B',
          c: 'C',
          optionc: 'C',
          '3': 'C',
          d: 'D',
          optiond: 'D',
          '4': 'D',
        };

        const correctOption = correctOptionMap[normalizedCorrectOption];
        if (!correctOption) {
          errors.push(
            `Row ${i + 1}: Invalid correct_option "${rawCorrectOption}" (use A/B/C/D or option_a/option_b/option_c/option_d)`
          );
          continue;
        }

        // Validate difficulty
        const rawDifficulty = (row.difficulty?.trim().toLowerCase() || 'medium');
        const validDifficulties = ['easy', 'medium', 'hard'];
        const difficulty = validDifficulties.includes(rawDifficulty) ? rawDifficulty as 'easy' | 'medium' | 'hard' : null;
        
        if (!difficulty) {
          errors.push(`Row ${i + 1}: Invalid difficulty "${row.difficulty}" (must be easy, medium, or hard)`);
          continue;
        }

        // Validate required fields
        if (!row.question_text?.trim()) {
          errors.push(`Row ${i + 1}: Missing question_text`);
          continue;
        }

        if (!row.option_a?.trim() || !row.option_b?.trim() || !row.option_c?.trim() || !row.option_d?.trim()) {
          errors.push(`Row ${i + 1}: All four options are required`);
          continue;
        }

        questions.push({
          id: crypto.randomUUID(),
          question_text: row.question_text.trim(),
          option_a: row.option_a.trim(),
          option_b: row.option_b.trim(),
          option_c: row.option_c.trim(),
          option_d: row.option_d.trim(),
          correct_option: correctOption,
          marks: parseInt(row.marks) || 1,
          difficulty,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to parse row';
        errors.push(`Row ${i + 1}: ${message}`);
      }
    }

    setParseResult({ success: questions.length, errors });
    return questions;
  };

  // Parse a single CSV line, handling quoted values
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
    // Accept CSV files by extension or MIME type
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
        
        // Normalize line endings (handle Windows \r\n and old Mac \r)
        text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        // Remove BOM if present
        if (text.charCodeAt(0) === 0xFEFF) {
          text = text.slice(1);
        }
        
        const questions = parseCSV(text);
        
        if (questions.length === 0) {
          toast({
            variant: 'destructive',
            title: 'No valid questions found',
            description: 'Please check the CSV format and try again. Make sure you have the required columns: question_text, option_a, option_b, option_c, option_d, correct_option',
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
          Upload a CSV file to import multiple questions at once
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
            Supports .csv files with question data
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
          <p>question_text, option_a, option_b, option_c, option_d, correct_option</p>
          <p className="font-medium mt-2">Optional columns:</p>
          <p>marks (default: 1), difficulty (easy/medium/hard, default: medium)</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CSVQuestionUpload;
