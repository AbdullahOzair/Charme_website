/**
 * About Page - Charmé Story with Animations
 */
import { Heart, Sparkles, Users, Award } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <section className="relative bg-neutral-100 py-20 md:py-32 overflow-hidden">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h1 
              className="text-5xl md:text-6xl font-light text-neutral-900 mb-6 tracking-tight animate-fadeIn"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Our Story
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 font-light leading-relaxed animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              Handmade stone jewelry crafted with heart, creativity, and timeless charm
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 border border-neutral-300 rounded-full animate-float"></div>
        <div className="absolute bottom-20 right-20 w-16 h-16 border border-neutral-300 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
      </section>

      {/* Main Content */}
      <section className="py-16 md:py-24">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            
            {/* Introduction */}
            <div className="prose prose-lg max-w-none mb-16">
              <div className="animate-slideInUp">
                <p className="text-neutral-700 leading-relaxed mb-6">
                  Welcome to <span className="font-semibold text-neutral-900">Charmé</span>, where every piece of jewelry is made by hand and filled with meaning. 
                  We create beautiful stone bracelets and necklaces designed to reflect personality, style, and individuality.
                </p>
              </div>

              <div className="animate-slideInUp" style={{ animationDelay: '0.1s' }}>
                <p className="text-neutral-700 leading-relaxed mb-6">
                  Our journey began with a passion for working with natural stones, beads, and handcrafted details. 
                  From carefully selecting each stone to designing balanced color combinations, every piece is created with patience, care, and creativity.
                </p>
              </div>

              <div className="animate-slideInUp" style={{ animationDelay: '0.2s' }}>
                <p className="text-neutral-700 leading-relaxed">
                  Because our jewelry is handmade in small batches, no two pieces are exactly the same. 
                  That’s what makes Charmé special — jewelry that feels personal, unique, and made just for you.
                </p>
              </div>
            </div>

            {/* Values Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              
              <div className="card p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 animate-slideInLeft group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-neutral-100 rounded-full group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
                    <Heart className="w-6 h-6 text-neutral-800" />
                  </div>
                  <h3 className="text-2xl font-light text-neutral-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Handmade with Care
                  </h3>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  Every bracelet and necklace is individually handcrafted, giving each design a personal touch that machines can never replace.
                </p>
              </div>

              <div className="card p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 animate-slideInRight group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-neutral-100 rounded-full group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
                    <Sparkles className="w-6 h-6 text-neutral-800" />
                  </div>
                  <h3 className="text-2xl font-light text-neutral-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Natural Stone Beauty
                  </h3>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  We work with beautiful natural stones and quality beads that bring color, texture, and elegance to every piece of jewelry.
                </p>
              </div>

              <div className="card p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 animate-slideInLeft group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-neutral-100 rounded-full group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
                    <Users className="w-6 h-6 text-neutral-800" />
                  </div>
                  <h3 className="text-2xl font-light text-neutral-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Made for Self-Expression
                  </h3>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  Our designs are created to help you express your mood, personality, and style — whether bold, elegant, or playful.
                </p>
              </div>

              <div className="card p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 animate-slideInRight group">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-neutral-100 rounded-full group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
                    <Award className="w-6 h-6 text-neutral-800" />
                  </div>
                  <h3 className="text-2xl font-light text-neutral-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    Quality You Can Trust
                  </h3>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  Strong threads, durable wires, and carefully chosen materials ensure your favorite Charmé pieces stay beautiful for years.
                </p>
              </div>

            </div>

            {/* Mission Statement */}
            <div className="card bg-neutral-900 text-white p-12 text-center animate-scaleIn">
              <h2 className="text-3xl md:text-4xl font-light mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Our Mission
              </h2>
              <p className="text-lg text-neutral-200 leading-relaxed max-w-2xl mx-auto">
                To create meaningful handmade stone jewelry that helps people express their individuality while celebrating the beauty of traditional craftsmanship in a modern world.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-neutral-100">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center animate-fadeInUp">
            <h2 className="text-3xl md:text-4xl font-light text-neutral-900 mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Explore Our Collection
            </h2>
            <p className="text-neutral-600 mb-8 leading-relaxed">
              Discover handmade stone bracelets and necklaces designed to match your vibe
            </p>
            <a 
              href="/shop" 
              className="btn-primary inline-flex items-center hover:scale-105 transition-transform duration-300"
            >
              Browse Products
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
