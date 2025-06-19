import React, { useState } from 'react';
import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
  const [activeSection, setActiveSection] = useState(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: 'beforeChildren',
        staggerChildren: 0.05,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0, opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24,
      },
    },
  };

  // Privacy policy sections with full content from the docx
  const sections = [
    {
      id: 'introduction',
      title: 'Introduction',
      content: `ValueVault.ai, based in Dallas, Texas, is an AI-powered platform specializing in the valuation of high-value assets. We are committed to protecting the privacy and security of your personal information while providing a transparent and trustworthy service. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you interact with our platform, including our website, valuation tools, and marketplace features. By using ValueVault.ai, you agree to the practices outlined in this policy.`
    },
    {
      id: 'scope',
      title: 'Scope',
      content: `This Privacy Policy applies to all users of the ValueVault.ai platform, including individuals submitting asset data for valuation, listing items for sale, browsing marketplace offerings, or otherwise engaging with our services. It covers personal information provided directly by you, as well as data collected automatically through your use of the platform.`
    },
    {
      id: 'collect',
      title: 'Information We Collect',
      subsections: [
        {
          subtitle: 'Personal Information You Provide',
          items: [
            'Account Information: When you create an account, we may collect details such as your full name, email address, phone number, and mailing address to facilitate communication and verify your identity.',
            'Asset Data: To generate valuations or list items in the marketplace, you may submit specifics about your assets, including descriptions (e.g., make, model, year), condition details (e.g., maintenance history, upgrades), and supporting materials (e.g., photographs, certificates of authenticity, or ownership documents).',
            'Transaction Details: If you participate in the marketplace, we may collect information related to your buying or selling activities, such as contact details for counterparties, communication records, and confirmation of completed sales.',
            'Support Requests: When you contact us for assistance, we may retain your inquiries, feedback, or correspondence to address your needs effectively.'
          ]
        },
        {
          subtitle: 'Automatically Collected Information',
          items: [
            'Usage Data: We gather data about how you interact with the platform, including pages visited, features used, time spent on the site, and the sequence of actions taken (e.g., submitting an asset for valuation or browsing listings).',
            'Device and Technical Data: This includes your IP address, browser type, operating system, device identifiers, and network information, which help us optimize the platform&apos;s performance and security.',
            'Cookies and Tracking Technologies: We use cookies, web beacons, and similar tools to enhance your experience, track usage patterns, and deliver personalized content. These may include session cookies (temporary) and persistent cookies (stored for future visits). You can manage cookie preferences through your browser settings.'
          ]
        },
        {
          subtitle: 'Third-Party Information',
          items: [
            'We may receive data from external sources, such as market databases, public records, or analytics partners, to enrich our valuation algorithms and improve marketplace functionality. This data is typically aggregated or anonymized but may be linked to your inputs for accuracy.'
          ]
        }
      ]
    },
    {
      id: 'use',
      title: 'How We Use Your Information',
      subsections: [
        {
          subtitle: 'Service Delivery',
          items: [
            'Valuation Generation: Personal and asset data you provide is processed by our proprietary AI to produce valuation estimates based on market trends, historical sales, and behavioral patterns.',
            'Marketplace Operations: We use your information to create listings, connect you with buyers or sellers, and facilitate communication for potential transactions.',
            'User Experience: Technical and usage data helps us customize the platform, troubleshoot issues, and ensure compatibility across devices.'
          ]
        },
        {
          subtitle: 'Communication',
          items: [
            'We may send you updates about your account, valuation results, marketplace activity, or policy changes via email, phone, or in-platform notifications.',
            'Promotional messages about new features, services, or market insights may also be sent, though you can opt out of these at any time.'
          ]
        },
        {
          subtitle: 'Improvement and Analytics',
          items: [
            'Aggregated and anonymized data from user interactions is analyzed to refine our AI algorithms, enhance valuation accuracy, and identify trends in the high-value asset market.',
            'Feedback you provide may be used to address bugs, improve usability, or develop new tools.'
          ]
        },
        {
          subtitle: 'Legal and Security Purposes',
          items: [
            'Your information may be used to comply with applicable laws, respond to legal requests (e.g., subpoenas), or protect the rights, safety, and property of ValueVault.ai and its users.',
            'We monitor data to detect and prevent fraud, unauthorized access, or misuse of the platform.'
          ]
        }
      ]
    },
    {
      id: 'share',
      title: 'How We Share Your Information',
      subsections: [
        {
          subtitle: 'With Service Providers',
          items: [
            'We partner with third-party vendors (e.g., cloud hosting providers, payment processors, or analytics firms) to support platform operations. These entities are bound by strict confidentiality agreements and may only use your data as directed by us.'
          ]
        },
        {
          subtitle: 'Marketplace Participants',
          items: [
            'If you list an asset for sale, relevant details (e.g., asset description, photos, and estimated value) will be shared with potential buyers. Similarly, if you express interest in a listing, your contact information may be shared with the seller to facilitate the transaction.',
            'Personal identifiers (e.g., full name or email) are shared only as necessary and with your consent during the transaction process.'
          ]
        },
        {
          subtitle: 'Legal Compliance',
          items: [
            'We may disclose your information if required by law, regulation, or court order, or to respond to governmental inquiries or investigations.',
            'In the event of a business transition (e.g., merger, acquisition, or sale), your data may be transferred to the succeeding entity, subject to equivalent privacy protections.'
          ]
        },
        {
          subtitle: 'Aggregate Data',
          items: [
            'Anonymized or aggregated data (e.g., market trends or average asset values) may be shared with partners, researchers, or the public for industry analysis, marketing, or educational purposes. This data cannot be traced back to you individually.'
          ]
        }
      ]
    },
    {
      id: 'security',
      title: 'Data Security',
      content: [
        'We employ industry-standard measures—such as encryption, firewalls, and secure server environments—to protect your information from unauthorized access, loss, or alteration.',
        'Access to your data within ValueVault.ai is restricted to personnel who require it to perform their roles, and all are trained in data protection protocols.',
        'While we strive to safeguard your information, no system is entirely immune to breaches. In the unlikely event of a security incident, we will notify affected users promptly and take steps to mitigate harm, in accordance with applicable laws.'
      ]
    },
    {
      id: 'rights',
      title: 'Your Choices and Rights',
      subsections: [
        {
          subtitle: 'Access and Updates',
          items: [
            'You may review or modify your account information at any time by logging into the platform and visiting your profile settings.',
            'If you need assistance accessing or correcting data, contact our support team via the methods listed below.'
          ]
        },
        {
          subtitle: 'Opt-Out Options',
          items: [
            'You can unsubscribe from promotional communications by following the instructions in those messages or adjusting your notification preferences in your account.',
            'Essential service-related notifications (e.g., valuation results or transaction updates) cannot be disabled while you remain an active user.'
          ]
        },
        {
          subtitle: 'Data Deletion',
          items: [
            'You may request the deletion of your account and associated personal data by submitting a request through our support channels. We will process such requests promptly, though some data may be retained for legal compliance or operational purposes (e.g., transaction records).'
          ]
        },
        {
          subtitle: 'Tracking Preferences',
          items: [
            'You can disable cookies or adjust tracking settings via your browser, though this may limit certain platform features (e.g., personalized recommendations).'
          ]
        }
      ]
    },
    {
      id: 'thirdparty',
      title: 'Third-Party Links and Services',
      content: [
        'The ValueVault.ai platform may contain links to external websites, such as market research sources or payment gateways. We are not responsible for the privacy practices or content of these third parties.',
        'We encourage you to review the privacy policies of any external services you engage with through our platform.'
      ]
    },
    {
      id: 'international',
      title: 'International Data Transfers',
      content: [
        'ValueVault.ai operates primarily from Dallas, Texas, but may use service providers or store data in other regions. If your information is transferred outside your home jurisdiction, we ensure it remains protected under safeguards equivalent to those outlined here, in compliance with applicable data protection laws.'
      ]
    },
    {
      id: 'children',
      title: 'Children&apos;s Privacy',
      content: [
        'The ValueVault.ai platform is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from minors. If we discover such data has been submitted, we will take steps to delete it immediately.'
      ]
    },
    {
      id: 'changes',
      title: 'Changes to This Privacy Policy',
      content: [
        'We may update this policy periodically to reflect changes in our practices, technology, or legal requirements. Revised versions will be posted on our website with an updated effective date.',
        'Significant changes (e.g., new data-sharing practices) will be communicated to users through email or in-platform alerts, giving you the opportunity to review and adjust your usage accordingly.'
      ]
    },
    {
      id: 'contact',
      title: 'Contact Us',
      content: [
        'For questions, concerns, or requests related to your privacy or this policy, please reach out to us at:',
        'Email: contact@valuevault.ai',
        'Address: ValueVault.ai, 539 W. Commerce St Suite 6614, Dallas TX 75208 United States',
        'We aim to respond to all inquiries within a reasonable timeframe, typically within 30 days, depending on the complexity of the request.'
      ]
    },
    {
      id: 'acknowledgment',
      title: 'Acknowledgment',
      content: [
        'By using ValueVault.ai, you acknowledge that you have read and understood this Privacy Policy and consent to the collection, use, and sharing of your information as described. We value your trust and are dedicated to maintaining the confidentiality and security of your data while delivering a valuable service for high-value asset valuation and transactions.'
      ]
    }
  ];

  // Handle section toggle and scrolling
  const handleSectionToggle = (sectionId) => {
    setActiveSection(activeSection === sectionId ? null : sectionId);
    
    // Scroll to section
    if (activeSection !== sectionId) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container relative z-10 px-4 py-16 mx-auto max-w-7xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          {/* Header Section with enhanced styling */}
          <motion.section variants={itemVariants} className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Privacy Policy</h1>
                <div className="absolute -bottom-4 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full"></div>
              </div>
            </div>
            <p className="text-xl text-gray-300 mt-8">
              <span className="font-medium">ValueVault.ai</span> • <span className="text-gray-400">Effective Date: March 15, 2025</span>
            </p>
            <p className="mt-6 max-w-2xl mx-auto text-gray-300 leading-relaxed">
              Protecting your privacy while valuing your assets. Our comprehensive policy ensures transparency and security in every interaction.
            </p>
          </motion.section>

          {/* Main content with sidebar navigation */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar Navigation */}
            <motion.aside 
              variants={itemVariants}
              className="lg:w-1/4 lg:sticky lg:top-8 lg:self-start h-screen overflow-auto"
            >
              <div className="p-6 rounded-xl backdrop-blur-md bg-gray-900/30 border border-gray-700/50 shadow-xl">
                <h2 className="text-2xl font-bold mb-4 text-white">Quick Navigation</h2>
                <div className="flex flex-col space-y-2">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => handleSectionToggle(section.id)}
                      className={`text-left p-3 rounded-lg transition-all duration-300 ${
                        activeSection === section.id 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                          : 'bg-gray-800/50 hover:bg-gray-700/70 text-gray-300'
                      }`}
                    >
                      {section.title}
                    </button>
                  ))}
                </div>
              </div>
            </motion.aside>

            {/* Main Content - Each section with enhanced styling */}
            <div className="lg:w-3/4 space-y-24">
              {sections.map((section, index) => (
                <motion.section
                  key={section.id}
                  id={section.id}
                  variants={itemVariants}
                  className="relative p-6 sm:p-8 rounded-2xl backdrop-blur-md bg-black/20 shadow-xl border border-gray-800 overflow-hidden"
                >
                  {/* Decorative section number */}
                  <div className="absolute -top-6 -left-6 text-9xl font-bold text-gray-700/10">
                    {index + 1}
                  </div>
                  
                  <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-8 inline-block text-white">
                      <span className="relative">
                        {section.title}
                        <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></span>
                      </span>
                    </h2>

                    {/* Display content based on section structure */}
                    {section.content && !Array.isArray(section.content) && (
                      <p className="text-gray-300 leading-relaxed mb-6 text-lg">{section.content}</p>
                    )}
                    
                    {section.content && Array.isArray(section.content) && (
                      <div className="space-y-4">
                        {section.content.map((paragraph, idx) => (
                          <p key={idx} className="text-gray-300 leading-relaxed">{paragraph}</p>
                        ))}
                      </div>
                    )}
                    
                    {section.subsections && (
                      <div className="space-y-8 mt-6">
                        {section.subsections.map((subsection, idx) => (
                          <div key={idx} className="bg-gray-800/30 rounded-xl p-6 border-l-4 border-blue-500">
                            <h3 className="text-xl font-semibold mb-4 text-blue-300">{subsection.subtitle}</h3>
                            <ul className="space-y-3">
                              {subsection.items.map((item, itemIdx) => (
                                <li key={itemIdx} className="flex items-start">
                                  <span className="text-blue-400 mr-2 mt-1">•</span>
                                  <span className="text-gray-300">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.section>
              ))}
              
              {/* Final call-to-action and contact section */}
              <motion.section 
                variants={itemVariants} 
                className="mt-20 p-8 sm:p-10 rounded-2xl bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-gray-700/50 text-center"
              >
                <h2 className="text-3xl font-bold mb-6 text-white">Questions About Your Privacy?</h2>
                <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                  We&apos;re committed to transparency and protecting your data. If you have any questions about our privacy practices, 
                  we&apos;re here to help.
                </p>
                
                <div className="inline-flex items-center justify-center space-x-4 mb-8">
                  <a 
                    href="mailto:contact@valuevault.ai" 
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-300 flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    Email Us
                  </a>
                  <div className="text-gray-300">
                    <div className="font-medium">539 W. Commerce St Suite 6614</div> 
                    <div>Dallas TX 75208, United States</div>
                  </div>
                </div>
                
                <p className="text-gray-400 italic text-sm">
                  By using ValueVault.ai, you acknowledge that you have read and understood this Privacy Policy and consent to the collection, 
                  use, and sharing of your information as described.
                </p>
              </motion.section>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;