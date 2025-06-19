import {
  Archive,
  Brush,
  ChevronLeft,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight,
  Crown,
  Edit,
  GalleryHorizontal,
  MessageSquareText,
  Package,
  Plus,
  Settings,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import CarouselEdit from "../components/AdminDashboard/CarouselEdit";
import CategoryManagement from "../components/AdminDashboard/CategoryManagement";
import CustomBuilder from "../components/AdminDashboard/CustomBuilder";
import { FaGoogle } from "react-icons/fa";
import Google from "./HomePage";
import ProductManagement from "../components/AdminDashboard/ProductManagement";
import SavedProducts from "../components/AdminDashboard/SavedProducts";
import SearchForm from "../components/AdminDashboard/SearchForm";
import SupportChatting from "../components/AdminDashboard/SupportChatting";
import TokenSection from "../components/AdminDashboard/TokenSection";
import UserComponent from "../components/AdminDashboard/Users";
import axios from "axios";
import logo from "../assets/img/logo.png";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin, fetchAdminData, deleteUser } = useAuth();
  const [activeTab, setActiveTab] = useState("stats");
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    recentLogins: [],
  });

  const [loading, setLoading] = useState(true);
  const tabsRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const data = await fetchAdminData();
        setStats(data.stats);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAdmin, navigate, fetchAdminData]);

  useEffect(() => {
    const handleScroll = () => {
      if (tabsRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1); // Added -1 to account for rounding issues
      }
    };

    const tabsElement = tabsRef.current;
    if (tabsElement) {
      tabsElement.addEventListener("scroll", handleScroll);
      // Initial check after a small delay to ensure DOM is fully rendered
      setTimeout(handleScroll, 100);
    }

    return () => {
      if (tabsElement) {
        tabsElement.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  const handleNavigateToHome = () => {
    navigate("/");
  };

  const scrollTabs = (direction) => {
    if (tabsRef.current) {
      const scrollAmount = 200; // Adjust this value as needed
      tabsRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const StatisticsTab = () => {
    const [plans, setPlans] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [steps, setSteps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [isTeamMemberModalOpen, setIsTeamMemberModalOpen] = useState(false);
    const [isStepModalOpen, setIsStepModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [selectedTeamMember, setSelectedTeamMember] = useState(null);
    const [selectedStep, setSelectedStep] = useState(null);
    const [planFormData, setPlanFormData] = useState({
      title: "",
      monthlyPrice: 0,
      features: "",
      isPopular: false,
      geoListing: "",
      geoSearchSessions: "",
      productValuation: "",
      isYearly: false,
    });
    const [teamMemberFormData, setTeamMemberFormData] = useState({
      name: "",
      role: "",
      bio: "",
      image: null,
    });
    const [stepFormData, setStepFormData] = useState({
      number: "",
      title: "",
      description: "",
      isReverse: false,
      image: null,
      youtubeUrl: "",
    });

    // Fetch plans, team members, and steps
    useEffect(() => {
      const fetchData = async () => {
        try {
          setLoading(true);
          setError(null);
          const [plansResponse, teamMembersResponse, stepsResponse] =
            await Promise.all([
              axios.get(`${process.env.REACT_APP_API_BASEURL}/api/plans`, {
                params: { email: user.email },
              }),
              axios.get(
                `${process.env.REACT_APP_API_BASEURL}/api/team-members`
              ),
              axios.get(`${process.env.REACT_APP_API_BASEURL}/api/steps`),
            ]);

          if (plansResponse.data && plansResponse.data.success) {
            setPlans(plansResponse.data.data);
          } else {
            throw new Error("Failed to fetch plans");
          }

          if (teamMembersResponse.data && teamMembersResponse.data.success) {
            setTeamMembers(teamMembersResponse.data.data);
          } else {
            throw new Error("Failed to fetch team members");
          }

          if (stepsResponse.data && stepsResponse.data.success) {
            setSteps(stepsResponse.data.data);
          } else {
            throw new Error("Failed to fetch steps");
          }
        } catch (error) {
          console.error("Error fetching data:", error);
          setError("Unable to load data. Please try again later.");
          toast.error("Failed to load data.");
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [user.email]);

    // Handle plan form input changes
    const handlePlanInputChange = (e) => {
      const { name, value, type, checked } = e.target;
      setPlanFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    };

    // Handle team member form input changes
    const handleTeamMemberInputChange = (e) => {
      const { name, value, files } = e.target;
      setTeamMemberFormData((prev) => ({
        ...prev,
        [name]: files ? files[0] : value,
      }));
    };

    // Handle step form input changes
    const handleStepInputChange = (e) => {
      const { name, value, type, checked, files } = e.target;
      setStepFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : files ? files[0] : value,
      }));
    };

    // Open modal for creating or editing a plan
    const openPlanModal = (plan = null) => {
      setSelectedPlan(plan);
      if (plan) {
        setPlanFormData({
          title: plan.title,
          monthlyPrice: plan.monthlyPrice,
          features: plan.features.join(", "),
          isPopular: plan.isPopular,
          geoListing: plan.geoListing,
          geoSearchSessions: plan.geoSearchSessions,
          isYearly: plan.isYearly,
          productValuation: plan.productValuation,
        });
      } else {
        setPlanFormData({
          title: "",
          monthlyPrice: 0,
          features: "",
          isPopular: false,
          geoListing: "",
          geoSearchSessions: "",
          isYearly: false,
          productValuation: "",
        });
      }
      setIsPlanModalOpen(true);
    };

    // Open modal for creating or editing a team member
    const openTeamMemberModal = (teamMember = null) => {
      setSelectedTeamMember(teamMember);
      if (teamMember) {
        setTeamMemberFormData({
          name: teamMember.name,
          role: teamMember.role,
          bio: teamMember.bio,
          image: null,
        });
      } else {
        setTeamMemberFormData({
          name: "",
          role: "",
          bio: "",
          image: null,
        });
      }
      setIsTeamMemberModalOpen(true);
    };

    // Open modal for creating or editing a step
    const openStepModal = (step = null) => {
      setSelectedStep(step);
      if (step) {
        setStepFormData({
          number: step.number,
          title: step.title,
          description: step.description,
          isReverse: step.isReverse,
          image: null,
          youtubeUrl: step.youtubeUrl || "",
        });
      } else {
        setStepFormData({
          number: "",
          title: "",
          description: "",
          isReverse: false,
          image: null,
          youtubeUrl: "",
        });
      }
      setIsStepModalOpen(true);
    };

    // Create or update a plan
    const handleSavePlan = async (e) => {
      e.preventDefault();
      try {
        const planData = {
          title: planFormData.title,
          monthlyPrice: parseFloat(planFormData.monthlyPrice),
          features: planFormData.features.split(",").map((f) => f.trim()),
          isPopular: planFormData.isPopular,
          geoListing: isNaN(planFormData.geoListing)
            ? planFormData.geoListing
            : parseInt(planFormData.geoListing),
          geoSearchSessions: isNaN(planFormData.geoSearchSessions)
            ? planFormData.geoSearchSessions
            : parseInt(planFormData.geoSearchSessions),

          isYearly: planFormData.isYearly,
          productValuation: isNaN(planFormData.productValuation)
            ? planFormData.productValuation
            : parseInt(planFormData.productValuation),
        };

        let response;
        if (selectedPlan) {
          response = await axios.put(
            `${process.env.REACT_APP_API_BASEURL}/api/plans/${selectedPlan._id}`,
            planData,
            {
              params: { email: user.email },
            }
          );
        } else {
          response = await axios.post(
            `${process.env.REACT_APP_API_BASEURL}/api/plans`,
            planData,
            {
              params: { email: user.email },
            }
          );
        }

        if (response.data && response.data.success) {
          setPlans((prev) =>
            selectedPlan
              ? prev.map((p) =>
                  p._id === selectedPlan._id ? response.data.data : p
                )
              : [...prev, response.data.data]
          );
          setIsPlanModalOpen(false);
          setError(null);
          toast.success(
            `Plan ${selectedPlan ? "updated" : "created"} successfully!`
          );
        } else {
          throw new Error("Failed to save plan");
        }
      } catch (error) {
        console.error("Error saving plan:", error);
        setError(
          error.response?.data?.message ||
            "Failed to save plan. Please try again."
        );
        toast.error(error.response?.data?.message || "Failed to save plan.");
      }
    };

    // Create or update a team member
    const handleSaveTeamMember = async (e) => {
      e.preventDefault();
      try {
        const formData = new FormData();
        formData.append("name", teamMemberFormData.name);
        formData.append("role", teamMemberFormData.role);
        formData.append("bio", teamMemberFormData.bio);
        if (teamMemberFormData.image) {
          formData.append("image", teamMemberFormData.image);
        }

        let response;
        if (selectedTeamMember) {
          response = await axios.put(
            `${process.env.REACT_APP_API_BASEURL}/api/team-members/${selectedTeamMember._id}`,
            formData,
            {
              params: { email: user.email },
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
        } else {
          response = await axios.post(
            `${process.env.REACT_APP_API_BASEURL}/api/team-members`,
            formData,
            {
              params: { email: user.email },
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
        }

        if (response.data && response.data.success) {
          setTeamMembers((prev) =>
            selectedTeamMember
              ? prev.map((m) =>
                  m._id === selectedTeamMember._id ? response.data.data : m
                )
              : [...prev, response.data.data]
          );
          setIsTeamMemberModalOpen(false);
          setError(null);
          toast.success(
            `Team member ${
              selectedTeamMember ? "updated" : "created"
            } successfully!`
          );
        } else {
          throw new Error("Failed to save team member");
        }
      } catch (error) {
        console.error("Error saving team member:", error);
        setError(
          error.response?.data?.message ||
            "Failed to save team member. Please try again."
        );
        toast.error(
          error.response?.data?.message || "Failed to save team member."
        );
      }
    };

    // Create or update a step
    const handleSaveStep = async (e) => {
      e.preventDefault();
      try {
        const formData = new FormData();
        formData.append("number", stepFormData.number);
        formData.append("title", stepFormData.title);
        formData.append("description", stepFormData.description);
        formData.append("isReverse", stepFormData.isReverse);
        if (stepFormData.image) {
          formData.append("image", stepFormData.image);
        }
        formData.append("youtubeUrl", stepFormData.youtubeUrl);

        let response;
        if (selectedStep) {
          response = await axios.put(
            `${process.env.REACT_APP_API_BASEURL}/api/steps/${selectedStep._id}`,
            formData,
            {
              params: { email: user.email },
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
        } else {
          response = await axios.post(
            `${process.env.REACT_APP_API_BASEURL}/api/steps`,
            formData,
            {
              params: { email: user.email },
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
        }

        if (response.data && response.data.success) {
          setSteps((prev) =>
            selectedStep
              ? prev.map((s) =>
                  s._id === selectedStep._id ? response.data.data : s
                )
              : [...prev, response.data.data]
          );
          setIsStepModalOpen(false);
          setError(null);
          toast.success(
            `Step ${selectedStep ? "updated" : "created"} successfully!`
          );
        } else {
          throw new Error("Failed to save step");
        }
      } catch (error) {
        console.error("Error saving step:", error);
        setError(
          error.response?.data?.message ||
            "Failed to save step. Please try again."
        );
        toast.error(error.response?.data?.message || "Failed to save step.");
      }
    };

    // Delete a plan
    const handleDeletePlan = async (id, title) => {
      if (
        window.confirm(`Are you sure you want to delete the "${title}" plan?`)
      ) {
        try {
          const response = await axios.delete(
            `${process.env.REACT_APP_API_BASEURL}/api/plans/${id}`,
            {
              params: { email: user.email },
            }
          );
          if (response.data && response.data.success) {
            setPlans((prev) => prev.filter((p) => p._id !== id));
            setError(null);
            toast.success("Plan deleted successfully!");
          } else {
            throw new Error("Failed to delete plan");
          }
        } catch (error) {
          console.error("Error deleting plan:", error);
          setError(
            error.response?.data?.message ||
              "Failed to delete plan. Please try again."
          );
          toast.error(
            error.response?.data?.message || "Failed to delete plan."
          );
        }
      }
    };

    // Delete a team member
    const handleDeleteTeamMember = async (id, name) => {
      if (
        window.confirm(
          `Are you sure you want to delete the team member "${name}"?`
        )
      ) {
        try {
          const response = await axios.delete(
            `${process.env.REACT_APP_API_BASEURL}/api/team-members/${id}`,
            {
              params: { email: user.email },
            }
          );
          if (response.data && response.data.success) {
            setTeamMembers((prev) => prev.filter((m) => m._id !== id));
            setError(null);
            toast.success("Team member deleted successfully!");
          } else {
            throw new Error("Failed to delete team member");
          }
        } catch (error) {
          console.error("Error deleting team member:", error);
          setError(
            error.response?.data?.message ||
              "Failed to delete team member. Please try again."
          );
          toast.error(
            error.response?.data?.message || "Failed to delete team member."
          );
        }
      }
    };

    // Delete a step
    const handleDeleteStep = async (id, title) => {
      if (
        window.confirm(`Are you sure you want to delete the step "${title}"?`)
      ) {
        try {
          const response = await axios.delete(
            `${process.env.REACT_APP_API_BASEURL}/api/steps/${id}`,
            {
              params: { email: user.email },
            }
          );
          if (response.data && response.data.success) {
            setSteps((prev) => prev.filter((s) => s._id !== id));
            setError(null);
            toast.success("Step deleted successfully!");
          } else {
            throw new Error("Failed to delete step");
          }
        } catch (error) {
          console.error("Error deleting step:", error);
          setError(
            error.response?.data?.message ||
              "Failed to delete step. Please try again."
          );
          toast.error(
            error.response?.data?.message || "Failed to delete step."
          );
        }
      }
    };

    return (
      <div className="container px-4 mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
          <div className="p-6 bg-gray-800 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-300">Total Users</h3>
              <Users className="w-6 h-6 text-[#2ab6e4]" />
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
          </div>

          <div className="p-6 bg-gray-800 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-300">
                Premium Users
              </h3>
              <Crown className="w-6 h-6 text-[#a017c9]" />
            </div>
            <p className="text-3xl font-bold text-white">
              {stats.premiumUsers}
            </p>
          </div>

          <div className="p-6 bg-gray-800 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-300">
                Recent Logins
              </h3>
              <User className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-white">
              {stats.recentLogins.length}
            </p>
          </div>
        </div>

        {/* Plans Management Section */}
        <div className="overflow-hidden bg-gray-800 rounded-xl mb-8">
          <div className="p-6 flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Plans List</h3>
            <button
              onClick={() => openPlanModal()}
              className="inline-flex items-center px-3 py-1 space-x-1 text-sm font-medium text黏white transition-colors rounded-md bg-blue-500 hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
              <span>Add Plan</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="px-6 py-3 text-sm font-medium text-gray-400">
                    Title
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-400">
                    Monthly Price
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-400">
                    Geo Listings
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-400">
                    Geo Search Sessions
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-400">
                    Product Valuation
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-400">
                    Popular
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-400">
                    Yearly
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {plans.map((plan) => (
                  <tr key={plan._id} className="hover:bg-gray-750">
                    <td className="px-6 py-4 text-white">{plan.title}</td>
                    <td className="px-6 py-4 text-gray-300">
                      ${plan.monthlyPrice}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {plan.geoListing}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {plan.geoSearchSessions}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {plan.productValuation}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          plan.isPopular
                            ? "bg-green-500/20 text-green-500"
                            : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {plan.isPopular ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          plan.isYearly
                            ? "bg-blue-500/20 text-blue-500"
                            : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {plan.isYearly ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex space-x-2">
                      <button
                        onClick={() => openPlanModal(plan)}
                        className="inline-flex items-center px-3 py-1 space-x-1 text-sm font-medium text-blue-500 transition-colors rounded-md bg-blue-500/10 hover:bg-blue-500/20"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan._id, plan.title)}
                        className="inline-flex items-center px-3 py-1 space-x-1 text-sm font-medium text-red-500 transition-colors rounded-md bg-red-500/10 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <TokenSection />

        {/* Team Members Management Section */}
        <div className="overflow-hidden bg-gray-800 rounded-xl mb-8">
          <div className="p-6 flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Team Members List</h3>
            <button
              onClick={() => openTeamMemberModal()}
              className="inline-flex items-center px-3 py-1 space-x-1 text-sm font-medium text-white transition-colors rounded-md bg-blue-500 hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
              <span>Add Team Member</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="px-6 py-3 text-sm font-medium text-gray-400">
                    Name
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-400">
                    Role
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-400">
                    Bio
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-400">
                    Image
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {teamMembers.map((member) => (
                  <tr key={member._id} className="hover:bg-gray-750">
                    <td className="px-6 py-4 text-white">{member.name}</td>
                    <td className="px-6 py-4 text-gray-300">{member.role}</td>
                    <td className="px-6 py-4 text-gray-300 truncate max-w-xs">
                      {member.bio}
                    </td>
                    <td className="px-6 py-4">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    </td>
                    <td className="px-6 py-4 flex space-x-2">
                      <button
                        onClick={() => openTeamMemberModal(member)}
                        className="inline-flex items-center px-3 py-1 space-x-1 text-sm font-medium text-blue-500 transition-colors rounded-md bg-blue-500/10 hover:bg-blue-500/20"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteTeamMember(member._id, member.name)
                        }
                        className="inline-flex items-center px-3 py-1 space-x-1 text-sm font-medium text-red-500 transition-colors rounded-md bg-red-500/10 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Steps Management Section */}
        <div className="overflow-hidden bg-gray-800 rounded-xl">
          <div className="p-6 flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Steps List</h3>
            <button
              onClick={() => openStepModal()}
              className="inline-flex items-center px-3 py-1 space-x-1 text-sm font-medium text-white transition-colors rounded-md bg-blue-500 hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
              <span>Add Step</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-700">
                  <th className="px-6 py-3 text-sm font-medium text-gray-400">
                    Number
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-400">
                    Title
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-400">
                    Description
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-400">
                    Reverse
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-400">
                    Image
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-400">
                    YouTube URL
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {steps.map((step) => (
                  <tr key={step._id} className="hover:bg-gray-750">
                    <td className="px-6 py-4 text-white">{step.number}</td>
                    <td className="px-6 py-4 text-gray-300">{step.title}</td>
                    <td className="px-6 py-4 text-gray-300 truncate max-w-xs">
                      {step.description}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          step.isReverse
                            ? "bg-green-500/20 text-green-500"
                            : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {step.isReverse ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <img
                        src={step.image}
                        alt={step.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                    </td>
                    <td className="px-6 py-4 text-gray-300 truncate max-w-xs">
                      {step.youtubeUrl ? (
                        <a
                          href={step.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {step.youtubeUrl}
                        </a>
                      ) : (
                        "None"
                      )}
                    </td>
                    <td className="px-6 py-4 flex space-x-2">
                      <button
                        onClick={() => openStepModal(step)}
                        className="inline-flex items-center px-3 py-1 space-x-1 text-sm font-medium text-blue-500 transition-colors rounded-md bg-blue-500/10 hover:bg-blue-500/20"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteStep(step._id, step.title)}
                        className="inline-flex items-center px-3 py-1 space-x-1 text-sm font-medium text-red-500 transition-colors rounded-md bg-red-500/10 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Plan Modal */}
        {isPlanModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto">
            <motion.div
              className="bg-gray-800 rounded-xl p-6 max-w-lg w-full"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-xl font-bold text-white mb-4">
                {selectedPlan ? "Edit Plan" : "Add Plan"}
              </h3>
              {error && <p className="text-red-500 mb-4">{error}</p>}
              <form onSubmit={handleSavePlan}>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={planFormData.title}
                    onChange={handlePlanInputChange}
                    className="w-full p-2 bg-gray-700 text-white rounded-md"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-1">
                    Monthly Price
                  </label>
                  <input
                    type="number"
                    name="monthlyPrice"
                    value={planFormData.monthlyPrice}
                    onChange={handlePlanInputChange}
                    className="w-full p-2 bg-gray-700 text-white rounded-md"
                    min="0"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-1">
                    Features (comma-separated)
                  </label>
                  <textarea
                    name="features"
                    value={planFormData.features}
                    onChange={handlePlanInputChange}
                    className="w-full p-2 bg-gray-700 text-white rounded-md"
                    rows="4"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-1">
                    Geo Listings
                  </label>
                  <input
                    type="text"
                    name="geoListing"
                    value={planFormData.geoListing}
                    onChange={handlePlanInputChange}
                    className="w-full p-2 bg-gray-700 text-white rounded-md"
                    placeholder="e.g., 50 or Unlimited"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-1">
                    Geo Search Sessions
                  </label>
                  <input
                    type="text"
                    name="geoSearchSessions"
                    value={planFormData.geoSearchSessions}
                    onChange={handlePlanInputChange}
                    className="w-full p-2 bg-gray-700 text-white rounded-md"
                    placeholder="e.g., 20 or Unlimited"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-1">
                    Product Valuation
                  </label>
                  <input
                    type="text"
                    name="productValuation"
                    value={planFormData.productValuation}
                    onChange={handlePlanInputChange}
                    className="w-full p-2 bg-gray-700 text-white rounded-md"
                    placeholder="e.g., 20 or Unlimited"
                    required
                  />
                </div>
                <div className="mb-4 flex items-center">
                  <input
                    type="checkbox"
                    name="isPopular"
                    checked={planFormData.isPopular}
                    onChange={handlePlanInputChange}
                    className="mr-2"
                  />
                  <label className="text-gray-300">Is Popular</label>
                </div>
                <div className="mb-4 flex items-center">
                  <input
                    type="checkbox"
                    name="isYearly"
                    checked={planFormData.isYearly}
                    onChange={handlePlanInputChange}
                    className="mr-2"
                  />
                  <label className="text-gray-300">Available Yearly</label>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsPlanModalOpen(false)}
                    className="px-4 py-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {/* Team Member Modal */}
        {isTeamMemberModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              className="bg-gray-800 rounded-xl p-6 max-w-lg w-full"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-xl font-bold text-white mb-4">
                {selectedTeamMember ? "Edit Team Member" : "Add Team Member"}
              </h3>
              {error && <p className="text-red-500 mb-4">{error}</p>}
              <form onSubmit={handleSaveTeamMember}>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={teamMemberFormData.name}
                    onChange={handleTeamMemberInputChange}
                    className="w-full p-2 bg-gray-700 text-white rounded-md"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-1">Role</label>
                  <input
                    type="text"
                    name="role"
                    value={teamMemberFormData.role}
                    onChange={handleTeamMemberInputChange}
                    className="w-full p-2 bg-gray-700 text-white rounded-md"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-1">Bio</label>
                  <textarea
                    name="bio"
                    value={teamMemberFormData.bio}
                    onChange={handleTeamMemberInputChange}
                    className="w-full p-2 bg-gray-700 text-white rounded-md"
                    rows="4"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-1">Image</label>
                  <input
                    type="file"
                    name="image"
                    onChange={handleTeamMemberInputChange}
                    className="w-full p-2 bg-gray-700 text-white rounded-md"
                    accept="image/*"
                    required={!selectedTeamMember}
                  />
                  {selectedTeamMember && teamMemberFormData.image && (
                    <p className="text-gray-400 text-sm mt-1">
                      New image selected: {teamMemberFormData.image.name}
                    </p>
                  )}
                  {selectedTeamMember && !teamMemberFormData.image && (
                    <p className="text-gray-400 text-sm mt-1">
                      Current image: {selectedTeamMember.image}
                    </p>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsTeamMemberModalOpen(false)}
                    className="px-4 py-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Step Modal */}
        {isStepModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              className="bg-gray-800 rounded-xl p-6 max-w-lg w-full"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-xl font-bold text-white mb-4">
                {selectedStep ? "Edit Step" : "Add Step"}
              </h3>
              {error && <p className="text-red-500 mb-4">{error}</p>}
              <form onSubmit={handleSaveStep}>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-1">Number</label>
                  <input
                    type="text"
                    name="number"
                    value={stepFormData.number}
                    onChange={handleStepInputChange}
                    className="w-full p-2 bg-gray-700 text-white rounded-md"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={stepFormData.title}
                    onChange={handleStepInputChange}
                    className="w-full p-2 bg-gray-700 text-white rounded-md"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={stepFormData.description}
                    onChange={handleStepInputChange}
                    className="w-full p-2 bg-gray-700 text-white rounded-md"
                    rows="4"
                    required
                  />
                </div>
                <div className="mb-4 flex items-center">
                  <input
                    type="checkbox"
                    name="isReverse"
                    checked={stepFormData.isReverse}
                    onChange={handleStepInputChange}
                    className="mr-2"
                  />
                  <label className="text-gray-300">Reverse Layout</label>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-1">Image</label>
                  <input
                    type="file"
                    name="image"
                    onChange={handleStepInputChange}
                    className="w-full p-2 bg-gray-700 text-white rounded-md"
                    accept="image/*"
                  />
                  {selectedStep && stepFormData.image && (
                    <p className="text-gray-400 text-sm mt-1">
                      New image selected: {stepFormData.image.name}
                    </p>
                  )}
                  {selectedStep && !stepFormData.image && (
                    <p className="text-gray-400 text-sm mt-1">
                      Current image: {selectedStep.image}
                    </p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-1">
                    YouTube URL (optional)
                  </label>
                  <input
                    type="text"
                    name="youtubeUrl"
                    value={stepFormData.youtubeUrl}
                    onChange={handleStepInputChange}
                    className="w-full p-2 bg-gray-700 text-white rounded-md"
                    placeholder="e.g., https://www.youtube.com/watch?v=..."
                  />
                  {selectedStep && stepFormData.youtubeUrl && (
                    <p className="text-gray-400 text-sm mt-1">
                      Current YouTube URL: {selectedStep.youtubeUrl || "None"}
                    </p>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsStepModalOpen(false)}
                    className="px-4 py-2 text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[#2ab6e4]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col py-4 sm:flex-row sm:items-center sm:justify-between sm:h-16">
            <div className="flex items-center justify-between">
              <button
                onClick={handleNavigateToHome}
                className="flex items-center mr-4 text-sm text-gray-300 sm:text-base hover:text-white"
              >
                <ChevronLeft className="w-4 h-4 mr-1 sm:w-5 sm:h-5 sm:mr-2" />
                Back to Home
              </button>
              <div className="flex items-center">
                <img
                  src={logo}
                  alt="Logo"
                  className="h-6 mr-2 sm:h-8 sm:mr-3"
                />
                <span className="text-xl font-bold sm:text-2xl bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] text-transparent bg-clip-text">
                  Admin Dashboard
                </span>
              </div>
            </div>

            {user && (
              <div className="mt-4 sm:mt-0">
                <span className="text-sm text-gray-300 sm:text-base">
                  Welcome, {user.fullName}
                </span>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="relative">
            {showLeftArrow && (
              <button
                onClick={() => scrollTabs("left")}
                className="absolute -left-3 z-10 flex items-center justify-center w-8 h-8 -translate-y-1/2 bg-gray-800 rounded-full shadow top-1/2 hover:bg-gray-700"
                // style={{ left: '8px' }} // Added explicit positioning
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-300" />
              </button>
            )}
            <div
              ref={tabsRef}
              className="flex space-x-4 overflow-x-auto sm:space-x-8 hide-scrollbar py-2 pl-6 pr-6" // Adjusted padding
            >
              <button
                onClick={() => setActiveTab("stats")}
                className={`py-2 px-3 sm:px-4 whitespace-nowrap relative ${
                  activeTab === "stats"
                    ? "text-[#2ab6e4]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">User Statistics</span>
                </div>
                {activeTab === "stats" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2ab6e4]"></div>
                )}
              </button>

              <button
                onClick={() => setActiveTab("users")}
                className={`py-2 px-3 sm:px-4 whitespace-nowrap relative ${
                  activeTab === "users"
                    ? "text-[#2ab6e4]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Users</span>
                </div>
                {activeTab === "users" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2ab6e4]"></div>
                )}
              </button>

              <button
                onClick={() => setActiveTab("saved")}
                className={`py-2 px-3 sm:px-4 whitespace-nowrap relative ${
                  activeTab === "saved"
                    ? "text-[#2ab6e4]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Archive className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Saved Products</span>
                </div>
                {activeTab === "saved" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2ab6e4]"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab("categories")}
                className={`py-2 px-3 sm:px-4 whitespace-nowrap relative ${
                  activeTab === "categories"
                    ? "text-[#2ab6e4]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Category Management</span>
                </div>
                {activeTab === "categories" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2ab6e4]"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab("supportchat")}
                className={`py-2 px-3 sm:px-4 whitespace-nowrap relative ${
                  activeTab === "supportchat"
                    ? "text-[#2ab6e4]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <MessageSquareText className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Support Chat</span>
                </div>
                {activeTab === "supportchat" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2ab6e4]"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab("carousel")}
                className={`py-2 px-3 sm:px-4 whitespace-nowrap relative ${
                  activeTab === "carousel"
                    ? "text-[#2ab6e4]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <GalleryHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Carousel</span>
                </div>
                {activeTab === "carousel" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2ab6e4]"></div>
                )}
              </button>

              <button
                onClick={() => setActiveTab("custombuilder")}
                className={`py-2 px-3 sm:px-4 whitespace-nowrap relative ${
                  activeTab === "custombuilder"
                    ? "text-[#2ab6e4]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Brush className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Custom Builder</span>
                </div>
                {activeTab === "custombuilder" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2ab6e4]"></div>
                )}
              </button>

              <button
                onClick={() => setActiveTab("products")}
                className={`py-2 px-3 sm:px-4 whitespace-nowrap relative ${
                  activeTab === "products"
                    ? "text-[#2ab6e4]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>168</span>
                </div>
                {activeTab === "products" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2ab6e4]"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab("google")}
                className={`py-2 px-3 sm:px-4 whitespace-nowrap relative ${
                  activeTab === "google"
                    ? "text-[#2ab6e4]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <FaGoogle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Google</span>
                </div>
                {activeTab === "google" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2ab6e4]"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab("scrapData")}
                className={`py-2 px-3 sm:px-4 whitespace-nowrap relative ${
                  activeTab === "scrapData"
                    ? "text-[#2ab6e4]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <FaGoogle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>ScrapData</span>
                </div>
                {activeTab === "scrapData" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2ab6e4]"></div>
                )}
              </button>
            </div>
            {showRightArrow && (
              <button
                onClick={() => scrollTabs("right")}
                className="absolute -right-3 z-10 flex items-center justify-center w-8 h-8 -translate-y-1/2 bg-gray-800 rounded-full shadow top-1/2 hover:bg-gray-700"
                //  style={{ right: '8px' }} // Added explicit positioning
              >
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-6">
        {activeTab === "stats" ? (
          <StatisticsTab />
        ) : activeTab === "products" ? (
          <ProductManagement />
        ) : activeTab === "categories" ? (
          <CategoryManagement />
        ) : activeTab === "supportchat" ? (
          <SupportChatting />
        ) : activeTab === "carousel" ? (
          <CarouselEdit />
        ) : activeTab === "custombuilder" ? (
          <CustomBuilder />
        ) : activeTab === "google" ? (
          <Google />
        ) : activeTab === "scrapData" ? (
          <SearchForm />
        ) : activeTab === "users" ? (
          <UserComponent setStats={setStats} />
        ) : (
          <SavedProducts />
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
