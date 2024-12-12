import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Upload, BarChart2, Clock, Book, FileText, Users } from 'lucide-react'

export default function ResearchSummaryGenerator() {
  const [searchQuery, setSearchQuery] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
      setFile(droppedFile)
    } else {
      alert("Please drop a valid Excel file.")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Research Publications Summary Generator</h1>
        <p className="text-gray-600">Quickly generate summaries of professor research publications</p>
      </header>

      <Tabs defaultValue="text-search" className="mb-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text-search">Text Search</TabsTrigger>
          <TabsTrigger value="file-upload">File Upload</TabsTrigger>
        </TabsList>
        <TabsContent value="text-search">
          <Card>
            <CardHeader>
              <CardTitle>Search by Text</CardTitle>
              <CardDescription>Enter a professor's name or research topic</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="e.g., John Doe or Quantum Computing"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button>
                  <Search className="mr-2 h-4 w-4" /> Search
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="file-upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload Excel File</CardTitle>
              <CardDescription>Drag and drop or click to upload an Excel file</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                  isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">Drag and drop your Excel file here, or click to select</p>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  onChange={handleFileChange}
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" className="mt-4">
                    Select File
                  </Button>
                </label>
                {file && <p className="mt-2 text-sm text-green-600">File selected: {file.name}</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Publications</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">+20% from last year</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citation Count</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,284</div>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collaborators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32</div>
            <p className="text-xs text-muted-foreground">From 12 institutions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Research Summary</CardTitle>
            <CardDescription>Generated summary based on the input</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              <h3 className="font-bold mb-2">Key Findings:</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Discovered a new method for quantum entanglement, increasing efficiency by 30%</li>
                <li>Developed a novel algorithm for protein folding prediction, achieving 95% accuracy</li>
                <li>Published 5 papers in high-impact journals, including Nature and Science</li>
              </ul>
              <h3 className="font-bold mt-4 mb-2">Research Impact:</h3>
              <p>
                The professor's work has significantly advanced the field of quantum computing and computational
                biology. Their publications have been cited over 500 times in the past year alone.
              </p>
            </ScrollArea>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Searches</CardTitle>
            <CardDescription>Your last 5 searches</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Quantum Computing</span>
              </li>
              <li className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Dr. Jane Smith</span>
              </li>
              <li className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Artificial Intelligence</span>
              </li>
              <li className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Nanotechnology</span>
              </li>
              <li className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Prof. Michael Johnson</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Top Research Areas</h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Quantum Computing</Badge>
          <Badge variant="secondary">Artificial Intelligence</Badge>
          <Badge variant="secondary">Machine Learning</Badge>
          <Badge variant="secondary">Bioinformatics</Badge>
          <Badge variant="secondary">Nanotechnology</Badge>
          <Badge variant="secondary">Climate Change</Badge>
          <Badge variant="secondary">Renewable Energy</Badge>
          <Badge variant="secondary">Neuroscience</Badge>
        </div>
      </div>
    </div>
  )
}

