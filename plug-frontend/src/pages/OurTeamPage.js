// const teamMembers = [
//   {
//     name: "Andrew Villah",
//     role: "Partner",
//     image: "/assets/img/team/andrew.jpg",
//     bio: "Andrew brings deep strategic insight and years of experience navigating luxury markets. With a sharp understanding of what high-end buyers and sellers want, he ensures Valuevault.ai remains laser-focused on value, trust, and exclusivity. From big-picture vision to high-stakes deal-making, Andrew is a key force in driving the company’s forward momentum."
//   },
//   {
//     name: "Barine W. D",
//     role: "Partner",
//     image: "/assets/img/team/barine.jpg",
//     bio: "Barine plays a pivotal role in shaping the brand’s foundation and future. As a trusted partner, he’s involved in key investment decisions, strategic partnerships, and platform expansion. With a background in global luxury sourcing and business development, he adds weight, clarity, and consistency to Valuevault's elite reputation."
//   },
//   {
//     name: "Victor Devis",
//     role: "Chief Technology Officer",
//     image: "/assets/img/team/victor.jpg",
//     bio: "Victor leads all things tech. As CTO, he architects and scales the platform infrastructure, ensures AI model integrity, and keeps performance optimized across devices and users. With experience building scalable systems and secure APIs, he’s the one turning bold ideas into functioning realities. Victor’s leadership ensures that Valuevault.ai isn’t just smart — it’s bulletproof."
//   },
//   {
//     name: "Michael Koval",
//     role: "Lead AI Specialist & Developer",
//     image: "/assets/img/team/michael.jpg",
//     bio: "Michael is the engine behind our intelligent systems. He leads the development of proprietary AI tools that match buyers with high-end products, power visual search, and deliver personalized experiences. With deep expertise in machine learning, computer vision, and backend architecture, Michael ensures Valuevault.ai stays ahead of the curve — always fast, always smart."
//   },
//   {
//     name: "Agness Matinez",
//     role: "Director of Marketing & Sales",
//     image: "/assets/img/team/agness.jpg",
//     bio: "Agness is responsible for making sure the right eyes are on the right products. She oversees all marketing initiatives, brand campaigns, and customer acquisition funnels. Her deep understanding of luxury consumer behavior, paired with her ability to scale growth channels, makes her essential to Valuevault’s visibility, credibility, and conversion engine."
//   },
//   {
//     name: "Monica Bola",
//     role: "Senior Sales Specialist",
//     image: "/assets/img/team/monica.jpg",
//     bio: "Monica knows how to move premium products. With a strong background in high-ticket sales, she blends client relationship mastery with strategic deal-making. Her hands-on approach, deep product knowledge, and ability to close complex sales make her a key player in Valuevault’s luxury pipeline."
//   },
//   {
//     name: "Lian J",
//     role: "Senior Sales Specialist",
//     image: "/assets/img/team/lian.jpg",
//     bio: "Lian brings unmatched hustle and attention to detail to the sales process. She’s deeply customer-centric, ensuring that every client touchpoint feels personal and premium. Known for her consistency, follow-through, and ability to build long-term relationships, Lian helps elevate Valuevault’s reputation with every deal."
//   },
//   {
//     name: "Maria Matinez",
//     role: "Senior Sales Specialist",
//     image: "/assets/img/team/maria.jpg",
//     bio: "Maria specializes in luxury client onboarding and after-sales excellence. With years of experience managing elite clientele, she ensures that Valuevault buyers and sellers feel respected, informed, and taken care of from first touch to final transaction. Her presence strengthens customer loyalty and drives recurring high-value business."
//   }
// ];
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/HomePage/Footer';
import { motion } from 'framer-motion';
import axios from 'axios';

const TeamMember = ({ name, role, image, bio }, index) => (
  <motion.div
    className="bg-gray-800/50 rounded-2xl overflow-hidden backdrop-blur-md border border-gray-700/50 shadow-2xl transition-all duration-500 hover:shadow-blue-500/50 hover:-translate-y-2 hover:scale-105 hover:border-blue-500/70"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5, delay: 0.2 * (index + 1) }}
  >
    <img src={image} alt={name} className="w-full h-72 object-cover" />
    <div className="p-6">
      <h3 className="text-2xl font-semibold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">{name}</h3>
      <p className="text-blue-400 mb-4">{role}</p>
      <p className="text-gray-300 text-sm leading-relaxed">{bio}</p>
    </div>
  </motion.div>
);

const TeamValue = ({ title, description }, index) => (
  <motion.div
    className="bg-gray-800/50 p-6 rounded-2xl backdrop-blur-md border border-gray-700/50 shadow-2xl transition-all duration-500 hover:shadow-blue-500/50 hover:-translate-y-2 hover:scale-105 hover:border-blue-500/70"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5, delay: 0.2 * (index + 1) }}
  >
    <h3 className="text-xl font-semibold text-white mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">{title}</h3>
    <p className="text-gray-300">{description}</p>
  </motion.div>
);

export default function OurTeamPage() {
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const teamValues = [
    {
      title: "Integrity",
      description: "We uphold the highest standards of transparency and trust in every transaction."
    },
    {
      title: "Innovation",
      description: "Our team pioneers cutting-edge solutions to redefine the luxury asset market."
    },
    {
      title: "Excellence",
      description: "We strive for perfection, delivering unparalleled service and results."
    }
  ];

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${process.env.REACT_APP_API_BASEURL}/api/team-members`);
        if (response.data.success) {
          setTeamMembers(response.data.data);
        } else {
          throw new Error('Failed to fetch team members');
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
        setError('Unable to load team members. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[#2ab6e4]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            onClick={() => navigate(-1)}
            className="inline-block bg-gradient-to-r from-blue-500 to-blue-700 text-white py-2 px-6 rounded-full hover:from-blue-400 hover:to-blue-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-blue-500/50"
          >
            ← Back
          </button>
        </motion.div>

        {/* Header Section */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="text-5xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600 mb-4">Our Team</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">Meet the passionate experts driving ValueVault's mission to redefine luxury asset trading.</p>
        </motion.div>

        {/* Team Members Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {teamMembers.map((member, index) => (
            <TeamMember key={member._id} {...member} index={index} />
          ))}
        </div>

        {/* About Our Mission Section */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-center mb-10 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">Our Mission</h2>
          <div className="max-w-4xl mx-auto text-center bg-gray-800/50 p-10 rounded-2xl shadow-2xl backdrop-blur-md border border-gray-700/50 transition-all duration-500 hover:shadow-blue-500/50 hover:-translate-y-2">
            <motion.p
              className="text-gray-300 mb-6 text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              At ValueVault, our mission is to create a seamless, transparent, and innovative platform for trading luxury assets. 
              Our team is dedicated to connecting buyers and sellers worldwide, leveraging cutting-edge technology and deep market expertise 
              to deliver unparalleled value.
            </motion.p>
            <motion.p
              className="text-gray-300 text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              From yachts to real estate, we empower our clients to make informed decisions with confidence, supported by a team that 
              shares a passion for excellence and a commitment to redefining the luxury marketplace.
            </motion.p>
          </div>
        </div>

        {/* Team Values Section */}
        <div className="mb-20">
          <h2 className="text-4xl font-bold text-center mb-10 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamValues.map((value, index) => (
              <TeamValue key={index} {...value} index={index} />
            ))}
          </div>
        </div>

        {/* Our Impact Section */}
        <motion.div
          className="text-center bg-gray-800/50 py-12 px-6 rounded-2xl shadow-2xl backdrop-blur-md border border-gray-700/50 mb-20 transition-all duration-500 hover:shadow-blue-500/50 hover:-translate-y-2"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">Our Impact</h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto text-lg">
            Our team at ValueVault has transformed the luxury asset trading industry with innovative technology and unparalleled expertise. 
            From connecting global markets to pioneering AI-driven solutions, we're proud of the milestones we've achieved together.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 max-w-3xl mx-auto">
            <motion.div
              className="bg-gray-700/50 p-4 rounded-lg transition-transform hover:scale-105"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <p className="text-2xl font-bold text-white">10,000+</p>
              <p className="text-gray-300 text-sm">Successful Transactions</p>
            </motion.div>
            <motion.div
              className="bg-gray-700/50 p-4 rounded-lg transition-transform hover:scale-105"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <p className="text-2xl font-bold text-white">50+</p>
              <p className="text-gray-300 text-sm">Countries Reached</p>
            </motion.div>
            <motion.div
              className="bg-gray-700/50 p-4 rounded-lg transition-transform hover:scale-105"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <p className="text-2xl font-bold text-white">AI Innovation</p>
              <p className="text-gray-300 text-sm">Visual Search Launched</p>
            </motion.div>
          </div>
          <Link
            to="/how-it-works"
            className="inline-block bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 px-8 rounded-full hover:from-blue-400 hover:to-blue-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-blue-500/50"
          >
            Learn More
          </Link>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}