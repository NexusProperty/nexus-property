import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Landing: React.FC = () => {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero section */}
      <section className="relative flex flex-col items-center justify-center px-4 py-20 md:py-32 md:px-8 bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTAgOCkiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PGNpcmNsZSBzdHJva2U9IiMwMDAiIHN0cm9rZS1vcGFjaXR5PSIuMjUiIGN4PSI5MCIgY3k9IjkwIiByPSI5MCIvPjxwYXRoIGQ9Ik05MCAwQzU3LjYzIDAgMy4yNzcgNTcuNjMgMCA5MGMzLjI3NyAzMi4zNyA1Ny42MyA5MCA5MCA5MHM4Ni43MjMtNTcuNjMgOTAtOTBjLTMuMjc3LTMyLjM3LTU3LjYzLTkwLTkwLTkweiIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utb3BhY2l0eT0iLjI1Ii8+PHBhdGggZD0iTTAgOTBjMC0yNS43MiA1Ny42My00Ni42NiA5MC00Ni42NnM5MCAyMC45NCA5MCA0Ni42Ni01Ny42MyA0Ni42Ni05MCA0Ni42NlMwIDExNS43MiAwIDkweiIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utb3BhY2l0eT0iLjI1Ii8+PHBhdGggZD0iTTkwIDE4MGM1Ny42MyAwIDkwLTU3LjYzIDkwLTkwUzE0Ny42MyAwIDkwIDBTMCA1Ny42MyAwIDkwczMyLjM3IDkwIDkwIDkweiIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utb3BhY2l0eT0iLjI1Ii8+PC9nPjwvc3ZnPg==')] bg-repeat opacity-5"></div>
        </div>
        
        <div className="container max-w-4xl relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 bg-clip-text text-transparent mb-6">
            AI-Powered Property Appraisals
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Streamline and automate the property valuation process with accurate, 
            data-driven appraisals for the New Zealand market.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/register?role=agent">Real Estate Agents</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/register?role=customer">Property Owners</Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Features section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How AppraisalHub Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 text-xl font-bold">1</div>
              <h3 className="text-xl font-semibold mb-2">Input Property Address</h3>
              <p className="text-gray-600">
                Simply enter the property address to begin the appraisal process.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 text-xl font-bold">2</div>
              <h3 className="text-xl font-semibold mb-2">AI Data Analysis</h3>
              <p className="text-gray-600">
                Our AI connects to CoreLogic NZ and REINZ data to analyze market trends.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 text-xl font-bold">3</div>
              <h3 className="text-xl font-semibold mb-2">Generate Report</h3>
              <p className="text-gray-600">
                Receive a comprehensive appraisal with detailed market analysis.
              </p>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <Button size="lg" variant="outline" asChild>
              <Link to="/demo/property-data">Try Our Data Demo</Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-teal-500 py-16 px-4 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join AppraisalHub today and transform how you approach property valuations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-blue-50" asChild>
              <Link to="/register">Create Account</Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 mt-auto">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-6 md:mb-0">
              <h3 className="text-xl font-bold text-white mb-4">AppraisalHub</h3>
              <p className="max-w-xs">AI-powered property valuation platform for the New Zealand real estate market.</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-lg font-semibold mb-4">Resources</h4>
                <ul className="space-y-2">
                  <li><Link to="/help" className="hover:text-white">Help Center</Link></li>
                  <li><Link to="/guide" className="hover:text-white">Agent Guide</Link></li>
                  <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
                  <li><Link to="/demo/property-data" className="hover:text-white">Data Demo</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-4">Company</h4>
                <ul className="space-y-2">
                  <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                  <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                  <li><Link to="/careers" className="hover:text-white">Careers</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-4">Legal</h4>
                <ul className="space-y-2">
                  <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
                  <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} AppraisalHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
