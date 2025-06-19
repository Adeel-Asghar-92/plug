"use client";

import { useEffect, useState, useRef } from "react";
import { Trash2, MoreVertical, Eye, Shield, ShieldOff } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function UserComponent(props) {
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const { fetchAdminData, deleteUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const fetchDashboardData = async () => {
    try {
      const data = await fetchAdminData();
      setUsers(data.users);
      setAllUsers(data.users);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Close dropdown when clicking outside
  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
  //       setOpenDropdown(null);
  //     }
  //   };

  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, [])

  const handleDeleteUser = async (userId, userName) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${userName}'s account? This action cannot be undone.`
      )
    ) {
      try {
        await deleteUser(userId);

        // Refresh the data
        const data = await fetchAdminData();
        setUsers(data.users);
        props.setStats(data.stats);

        alert(`${userName} has been successfully deleted.`);
        setOpenDropdown(null);
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to delete user. Please try again.");
      }
    }
  };
  const handleBlockUnblock = async (userData) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_BASEURL}/api/user/toggleBlock`,
        {
          email: userData.email,
        }
      );

      alert(
        `${userData.fullName} has been ${
          userData.isBlocked ? "unblocked" : "blocked"
        } successfully.`
      );

      // Refresh the data after action
      const data = await fetchAdminData();
      setUsers(data.users);
      setOpenDropdown(null);
    } catch (error) {
      console.error("Error blocking/unblocking user:", error);
      alert("Failed to update user status. Please try again.");
    }
  };

  const handleViewProfile = async (userId, userName) => {
    navigate(`/user/${userId}`);
  };

  const toggleDropdown = (userId) => {
    setOpenDropdown(openDropdown === userId ? null : userId);
  };

  // Filter users based on search query
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    const filtered = allUsers.filter((user) =>
      user?.fullName?.toLowerCase()?.includes(value.toLowerCase())
    );

    setUsers(filtered);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[#2ab6e4]"></div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-gray-800 rounded-xl mb-8 m-5">
      <div className="p-6 flex justify-between items-center">
        <h3 className="mb-6 text-xl font-bold text-white">User List</h3>
        <div className="flex items-center justify-between mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            className="w-full px-3 py-2 bg-[#2A2A2A] text-white rounded-lg border border-gray-600 focus:border-[#2ab6e4] focus:outline-none"
            placeholder="Search users"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-700">
              <th className="px-6 py-3 text-sm font-medium text-gray-400">
                Name
              </th>
              <th className="px-6 py-3 text-sm font-medium text-gray-400">
                Email
              </th>
              <th className="px-6 py-3 text-sm font-medium text-gray-400">
                Subscription
              </th>
              <th className="px-6 py-3 text-sm font-medium text-gray-400">
                Last Login
              </th>
              <th className="px-6 py-3 text-sm font-medium text-gray-400">
                Visit Count
              </th>
              <th className="px-6 py-3 text-sm font-medium text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {users.map((userData) => (
              <tr key={userData._id} className="hover:bg-gray-750">
                <td className="px-6 py-4 text-white">{userData.fullName}</td>
                <td className="px-6 py-4 text-gray-300">{userData.email}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      userData.subscription?.title?.toLowerCase() === "premium"
                        ? "bg-[#a017c9]/20 text-[#a017c9]"
                        : userData.subscription?.title?.toLowerCase() ===
                          "basic"
                        ? "bg-green-500/20 text-green-500"
                        : userData.subscription?.title?.toLowerCase() ===
                          "standard"
                        ? "bg-[#2ab6e4]/20 text-[#2ab6e4]"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    {userData.subscription?.title || "Free"}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-300">
                  {new Date(userData.lastLogin).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-gray-300">
                  {userData.visitCount}
                </td>
                <td className="px-6 py-4 relative" ref={dropdownRef}>
                  <button
                    onClick={() => toggleDropdown(userData._id)}
                    className="inline-flex items-center justify-center w-8 h-8 text-gray-400 transition-colors rounded-md hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#2ab6e4] focus:ring-offset-2 focus:ring-offset-gray-800"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {openDropdown === userData._id && (
                    <div className="absolute right-0 z-50 mt-2 w-48 bg-gray-700 border border-gray-600 rounded-lg shadow-lg">
                      <div className="py-1">
                        {/* Block/Unblock Option */}
                        <button
                          onClick={(event) => {
                            debugger;
                            event.stopPropagation(); // Prevent event propagation
                            handleBlockUnblock(userData);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
                        >
                          {userData?.isBlocked ? (
                            <Shield className="w-4 h-4 mr-3 text-green-500" />
                          ) : (
                            <ShieldOff className="w-4 h-4 mr-3 text-yellow-500" />
                          )}
                          {userData?.isBlocked ? "Unblock User" : "Block User"}
                        </button>

                        {/* View Profile Option */}
                        <button
                          onClick={() =>
                            handleViewProfile(userData._id, userData.fullName)
                          }
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-3 text-blue-500" />
                          View Profile
                        </button>

                        {/* Separator */}
                        <div className="border-t border-gray-600 my-1"></div>

                        {/* Delete Option */}
                        <button
                          onClick={(event) => {
                            event.stopPropagation(); // Prevent event propagation
                            handleDeleteUser(userData._id, userData.fullName);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mr-3" />
                          Delete User
                        </button>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserComponent;
