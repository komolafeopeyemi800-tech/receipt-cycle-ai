import { useNavigate } from "react-router-dom";

const DesktopFooter = () => {
  const navigate = useNavigate();
  
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Column */}
          <div className="col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center">
                <i className="fas fa-receipt text-white text-lg"></i>
              </div>
              <span className="text-lg font-bold">Receipt Cycle</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              AI-powered expense tracking that scans receipts, detects money leaks, and helps you save smarter.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-primary transition-colors">
                <i className="fab fa-twitter text-white"></i>
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-primary transition-colors">
                <i className="fab fa-linkedin-in text-white"></i>
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-primary transition-colors">
                <i className="fab fa-facebook-f text-white"></i>
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-primary transition-colors">
                <i className="fab fa-instagram text-white"></i>
              </a>
            </div>
          </div>
          
          {/* Product Column */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              <li><a href="#features" className="text-gray-400 text-sm hover:text-white transition-colors">Features</a></li>
              <li><button onClick={() => navigate('/pricing')} className="text-gray-400 text-sm hover:text-white transition-colors">Pricing</button></li>
              <li><a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">Integrations</a></li>
              <li><a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">API Docs</a></li>
              <li><a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">Changelog</a></li>
            </ul>
          </div>
          
          {/* Company Column */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">Press Kit</a></li>
              <li><a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
          
          {/* Resources Column */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">Community</a></li>
              <li><button onClick={() => navigate('/privacy')} className="text-gray-400 text-sm hover:text-white transition-colors">Privacy Policy</button></li>
              <li><button onClick={() => navigate('/terms')} className="text-gray-400 text-sm hover:text-white transition-colors">Terms of Service</button></li>
              <li><button onClick={() => navigate('/refund-policy')} className="text-gray-400 text-sm hover:text-white transition-colors">Refund Policy</button></li>
              <li><a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">Security</a></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">© 2026 Receipt Cycle. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <i className="fas fa-shield-alt text-primary"></i>
              <span>SOC 2 Certified</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <i className="fas fa-lock text-primary"></i>
              <span>256-bit Encryption</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <i className="fas fa-user-shield text-primary"></i>
              <span>GDPR Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default DesktopFooter;
