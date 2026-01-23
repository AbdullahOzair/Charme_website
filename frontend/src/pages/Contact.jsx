/**
 * Contact Page - Get in Touch with Animations
 */
import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, Facebook, Instagram, Twitter } from 'lucide-react';
import toast from 'react-hot-toast';
import { contactAPI } from '../services/api';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await contactAPI.sendMessage(formData);
      
      if (response.data.success) {
        toast.success(response.data.message || 'Message sent successfully! We\'ll get back to you soon.');
        setFormData({ name: '', email: '', subject: '', message: '' });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      if (error.response?.data?.errors) {
        // Display validation errors
        const errors = error.response.data.errors;
        Object.values(errors).forEach(err => {
          toast.error(Array.isArray(err) ? err[0] : err);
        });
      } else {
        toast.error(error.response?.data?.message || 'Failed to send message. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      content: 'abdullahozair000@gmail.com',
      link: 'mailto:abdullahozair000@gmail.com',
      delay: '0.2s',
    },
    {
      icon: Phone,
      title: 'Phone',
      content: '+92 307 7881137',
      link: 'tel:+923077881137',
      delay: '0.3s',
    },
    {
      icon: MapPin,
      title: 'Address',
      content: 'mg mart E11\nIslamabad, Pakistan\n44000',
      delay: '0.4s',
    },
    {
      icon: Clock,
      title: 'Business Hours',
      content: 'Mon - Fri: 9:00 AM - 6:00 PM\nSat: 10:00 AM - 4:00 PM\nSun: Closed',
      delay: '0.5s',
    },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook', color: 'hover:bg-blue-600' },
    { icon: Instagram, href: '#', label: 'Instagram', color: 'hover:bg-pink-600' },
    { icon: Twitter, href: '#', label: 'Twitter', color: 'hover:bg-sky-500' },
  ];

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
              Contact Us
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 font-light leading-relaxed animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              We'd love to hear from you. Reach out with any questions or feedback.
            </p>
          </div>
        </div>
        {/* Decorative animated circles */}
        <div className="absolute top-10 left-10 w-20 h-20 border border-neutral-300 rounded-full animate-float"></div>
        <div className="absolute bottom-20 right-20 w-16 h-16 border border-neutral-300 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-12 h-12 border border-neutral-200 rounded-full animate-float" style={{ animationDelay: '0.5s' }}></div>
      </section>

      {/* Contact Content */}
      <section className="py-16 md:py-24">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-8">
              <div className="animate-slideInLeft">
                <h2 
                  className="text-2xl font-light text-neutral-900 mb-6"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Contact Information
                </h2>
                <p className="text-neutral-600 leading-relaxed mb-8">
                  Feel free to reach out through any of these channels. We're here to help!
                </p>
              </div>

              {/* Contact Cards */}
              <div className="space-y-4">
                {contactInfo.map((item, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-lg hover:bg-neutral-100 transition-all duration-300 hover:scale-105 animate-slideInLeft group"
                    style={{ animationDelay: item.delay }}
                  >
                    <div className="p-2 bg-neutral-900 rounded-full group-hover:rotate-12 transition-transform duration-300">
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-900 mb-1">{item.title}</h3>
                      {item.link ? (
                        <a 
                          href={item.link} 
                          className="text-neutral-600 hover:text-neutral-900 transition-colors"
                        >
                          {item.content}
                        </a>
                      ) : (
                        <p className="text-neutral-600 whitespace-pre-line">
                          {item.content}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Social Links */}
              <div className="pt-6 border-t border-neutral-200 animate-fadeIn" style={{ animationDelay: '0.6s' }}>
                <h3 className="font-medium text-neutral-900 mb-4">Follow Us</h3>
                <div className="flex gap-3">
                  {socialLinks.map((social, index) => (
                    <a 
                      key={index}
                      href={social.href} 
                      className={`p-3 bg-neutral-100 hover:text-white rounded-full transition-all duration-300 hover:scale-110 ${social.color}`}
                      aria-label={social.label}
                    >
                      <social.icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="card p-8 animate-slideInRight hover:shadow-2xl transition-shadow duration-500">
                <h2 
                  className="text-3xl font-light text-neutral-900 mb-6"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Send Us a Message
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                      <label htmlFor="name" className="label">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="input focus:ring-2 focus:ring-neutral-900 transition-all duration-300"
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
                      <label htmlFor="email" className="label">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="input focus:ring-2 focus:ring-neutral-900 transition-all duration-300"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
                    <label htmlFor="subject" className="label">
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="input focus:ring-2 focus:ring-neutral-900 transition-all duration-300"
                      placeholder="How can we help you?"
                    />
                  </div>

                  <div className="animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
                    <label htmlFor="message" className="label">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="input resize-none focus:ring-2 focus:ring-neutral-900 transition-all duration-300"
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>

                  <div className="animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary w-full md:w-auto hover:scale-105 transition-all duration-300 disabled:hover:scale-100"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Send Message
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 bg-neutral-100">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto animate-scaleIn">
            <div className="aspect-video bg-neutral-200 rounded-lg flex items-center justify-center hover:shadow-xl transition-shadow duration-500 overflow-hidden group">
              <div className="text-center text-neutral-500 group-hover:scale-110 transition-transform duration-500">
                <MapPin className="w-12 h-12 mx-auto mb-4 animate-bounce" />
                <p className="font-medium">Map will be embedded here</p>
                <p className="text-sm mt-2">(Replace with Google Maps iframe later)</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
