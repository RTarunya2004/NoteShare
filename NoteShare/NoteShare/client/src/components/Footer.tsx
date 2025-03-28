import { Github, Twitter, Facebook, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <span className="text-primary text-xl mr-2"><i className="fa-solid fa-book-open"></i></span>
            <span className="font-bold text-lg text-gray-800">NoteShare</span>
          </div>
          <div className="flex space-x-6 text-gray-500">
            <a href="#" className="hover:text-primary">About</a>
            <a href="#" className="hover:text-primary">Terms</a>
            <a href="#" className="hover:text-primary">Privacy</a>
            <a href="#" className="hover:text-primary">Help</a>
            <a href="#" className="hover:text-primary">Contact</a>
          </div>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-gray-500 hover:text-primary">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="text-gray-500 hover:text-primary">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="text-gray-500 hover:text-primary">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" className="text-gray-500 hover:text-primary">
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} NoteShare. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
