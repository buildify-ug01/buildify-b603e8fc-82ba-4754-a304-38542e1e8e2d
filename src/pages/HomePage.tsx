
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';

const HomePage = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-10 md:mb-0">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  Build React Apps with AI
                </h1>
                <p className="text-xl mb-8 opacity-90">
                  Create, customize, and deploy React applications in minutes using Gemini AI. No coding experience required.
                </p>
                <div className="flex flex-wrap gap-4">
                  {user ? (
                    <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-gray-100">
                      <Link to="/dashboard">Go to Dashboard</Link>
                    </Button>
                  ) : (
                    <>
                      <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-gray-100">
                        <Link to="/register">Get Started</Link>
                      </Button>
                      <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-blue-700">
                        <Link to="/login">Sign In</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="bg-white p-2 rounded-lg shadow-xl">
                  <div className="bg-gray-800 rounded-md overflow-hidden">
                    <div className="flex items-center px-4 py-2 border-b border-gray-700">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                      <div className="mx-auto text-gray-400 text-sm">App.tsx</div>
                    </div>
                    <div className="p-4 text-gray-300 font-mono text-sm">
                      <pre className="whitespace-pre-wrap">
{`import React from 'react';
import { Button } from './components/ui/button';

function App() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Hello, AI-Generated App!
      </h1>
      <Button>Click Me</Button>
    </div>
  );
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 text-xl font-bold">1</div>
                <h3 className="text-xl font-semibold mb-2">Describe Your App</h3>
                <p className="text-gray-600">Simply describe what you want to build in plain English. Our AI understands your requirements.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 text-xl font-bold">2</div>
                <h3 className="text-xl font-semibold mb-2">Generate Code</h3>
                <p className="text-gray-600">Our AI generates clean, modern React code based on your description using the Gemini API.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 text-xl font-bold">3</div>
                <h3 className="text-xl font-semibold mb-2">Customize & Deploy</h3>
                <p className="text-gray-600">Preview your app, make adjustments, and deploy it to the web with just a few clicks.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gray-100">
          <div className="container mx-auto px-4 max-w-6xl text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Build Your React App?</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of developers who are building faster with AI assistance.
            </p>
            {user ? (
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Link to="/register">Get Started for Free</Link>
              </Button>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;