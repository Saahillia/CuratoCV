import { Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ProfessionalSummaryForm = ({data, onChange}) => {

    const[ isGenerating, setIsGenerating] = useState(false);

    const generateSummary = async () => {
        try {
            setIsGenerating(true);
            // Delegate to the backend, which enforces the AI credit
            // entitlement and never exposes the AI provider key.
            const response = await api.post("/ai/enhance-pro-sum", { userContent: data || "" });
            onChange(response.data.enhancedContent);
            setIsGenerating(false);
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        }finally {
            setIsGenerating(false);
        }
    }

  return (
    <div className="space-y-4" >
        <div className="flex items-center justify-between" >
            <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900" >
                    Professional Summary</h3>
                <p className="text-sm text-gray-500" >Add Summary for your resume here</p>
            </div>
            <button disabled={isGenerating} onClick={generateSummary} className="flex items-center gap-2 px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors disabled:opacity-50" >
                {isGenerating ?(<Loader2 className="size-4 animate-spin" />) : (<Sparkles className="size-4" />)}
                {isGenerating ? "Generating..." : "AI Enhance"}
            </button>
        </div>

        <div className="mt-6"> 
            <textarea value={data || ""} onChange={(e) => onChange(e.target.value)} rows={8} className="w-full p-3 px-4 mt-2 border text-sm border-gray-300 rounded-lg focus:ring focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none" placeholder="Write a compelling professional summary that highlights your key strenghts and carrer objectives..." />
            <p className="text-xs text-gray-500 max-w-4/5 mx-auto text-center" >Tip: keep it concise (3-4 sentences) and focus on your most relevant achievements and skills. </p>
        </div>
    </div>
  )
}

export default ProfessionalSummaryForm