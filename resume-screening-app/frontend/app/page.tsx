'use client'

import { useState } from 'react'
import { Upload, FileText, Sparkles, Target, Zap, CheckCircle2, XCircle, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

type View = 'landing' | 'upload' | 'processing' | 'results'

interface ExtractedEntities {
  education: string[]
  experience: string[]
  certifications: string[]
}

interface MockResults {
  matchScore: number
  bestRole: string
  matchedSkills: string[]
  missingSkills: string[]
  extractedEntities: ExtractedEntities
}

export default function Home() {
  const [view, setView] = useState<View>('landing')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [jobDescription, setJobDescription] = useState<string>('')
  const [dragActive, setDragActive] = useState<boolean>(false)
  const [analysisResult, setAnalysisResult] = useState<MockResults | null>(null);

  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0 || !jobDescription.trim()) {
      alert('Please upload a resume and provide a job description');
      return;
    }
    
    setView('processing');

    try {
      const formData = new FormData();
      formData.append('job_desc', jobDescription);
      formData.append('file', uploadedFiles[0]);

      const response = await fetch('/api/screen', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to analyze resume');

      const data = await response.json();
      setAnalysisResult(data);
      setView('results');
    } catch (error) {
      console.error(error);
      alert('An error occurred during analysis');
      setView('upload');
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      if (validTypes.includes(file.type)) setUploadedFiles([file])
      else alert('Please upload a PDF, DOCX, or TXT file')
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFiles([e.target.files[0]])
    }
  }

  const mockResults: MockResults = {
    matchScore: 85,
    bestRole: 'Junior Data Analyst',
    matchedSkills: ['Python', 'Data Analysis', 'SQL', 'Excel', 'Pandas', 'Data Visualization', 'Statistics'],
    missingSkills: ['Tableau', 'R', 'Machine Learning', 'Power BI'],
    extractedEntities: {
      education: ['Bachelor of Science in Computer Science', 'University of California, 2022'],
      experience: ['Data Intern at TechCorp', 'Research Assistant at UC Lab'],
      certifications: ['Google Data Analytics Certificate', 'SQL Fundamentals']
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 text-slate-900">
      {/* Landing View */}
      {view === 'landing' && (
        <div className="container mx-auto px-4 py-12">
          <div className="text-center max-w-4xl mx-auto mb-16 pt-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Resume Analysis</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 bg-clip-text text-transparent leading-tight">
              Resume Screening
            </h1>
            
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Match candidates to roles in seconds with our advanced Natural Language Processing engine. 
              Powered by embeddings and semantic similarity algorithms.
            </p>
            
            <Button 
              size="lg" 
              onClick={() => setView('upload')}
              className="bg-blue-600 hover:bg-blue-700 hover:cursor-pointer text-white px-8 py-6 text-lg rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              <Target className="w-5 h-5 mr-2" />
              Start Screening
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            <FeatureCard icon={<Zap className="text-blue-600" />} title="Lightning Fast" desc="Screen hundreds of resumes in minutes." />
            <FeatureCard icon={<Target className="text-green-600" />} title="Precise Matching" desc="AI-driven semantic analysis for accuracy." />
            <FeatureCard icon={<Sparkles className="text-purple-600" />} title="Smart Insights" desc="Extract skills and education automatically." />
          </div>
        </div>
      )}

      {/* Upload View */}
      {view === 'upload' && (
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <Button variant="ghost" onClick={() => setView('landing')} className="mb-6 hover:cursor-pointer">← Back</Button>
            
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Upload Resume & Job Description</h2>
              <p className="text-slate-600 text-lg">Intelligent resume parsing and semantic matching, powered by AI</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="border-2 border-dashed bg-white/80">
                <CardHeader>
                  <CardTitle className="text-lg">Resume Upload</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300'}`}
                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                  >
                    <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileInput} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                    {uploadedFiles.length === 0 ? <p className="text-sm">Drag & drop or click to upload</p> : <p className="text-green-600 font-medium">{uploadedFiles[0].name}</p>}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 bg-white/80">
                <CardHeader><CardTitle className="text-lg">Job Description</CardTitle></CardHeader>
                <CardContent>
                  <Textarea placeholder="Paste role requirements here..." value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} className="min-h-[180px]" />
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Button size="lg" onClick={handleAnalyze} disabled={uploadedFiles.length === 0 || !jobDescription.trim()} className="bg-blue-600 hover:bg-blue-700 hover:cursor-pointer text-white px-12 py-6 text-lg rounded-xl shadow-lg">
                Analyze Match
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Processing & Results logic follows the same structure... */}
      {view === 'processing' && <div className="text-center mt-32"><h2 className="text-3xl font-bold animate-pulse">NLP Engine Processing...</h2></div>}
      
      {view === 'results' && (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
           <Button variant="ghost" onClick={() => setView('upload')} className="mb-6 hover:cursor-pointer">← New Analysis</Button>
           <Card className="p-8 text-center shadow-2xl bg-white/80">
              <div className="text-6xl font-bold text-blue-600 mb-4">{analysisResult?.matchScore}%</div>
              <h2 className="text-2xl font-bold mb-4">Strong Match for {analysisResult?.bestRole}</h2>
              <div className="flex flex-wrap gap-2 justify-center">
                {analysisResult?.matchedSkills.map(s => <Badge key={s} className="bg-green-100 text-green-700">{s}</Badge>)}
              </div>
           </Card>
        </div>
      )}
    </div>
  )
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
      <CardHeader>
        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">{icon}</div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
    </Card>
  )
}