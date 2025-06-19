import React, { useState, useEffect } from "react";
import axios from "axios";
import { Repeat, ArrowUpFromLine, Trash2, X, Plus } from "lucide-react";

const adminEmail = process.env.REACT_APP_ADMIN_EMAIL;
const adminUser = process.env.ADMIN_USER;
const adminPass = process.env.ADMIN_PASS;

export default function CarouselEdit() {
  const [carousels, setCarousels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [restrictions, setRestrictions] = useState([]);
  const [newRestriction, setNewRestriction] = useState("");
  const [newLink, setNewLink] = useState("");
  const [linkerror, setLinkError] = useState(false);

  // Fetch carousels from the backend
  const fetchCarousels = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/admin/carousels", {
        params: { email: adminEmail },
        headers: {
          username: adminUser,
          password: adminPass,
        },
      });
      setCarousels(res.data.carousels);
    } catch (err) {
      setError("Failed to load carousels");
    } finally {
      setLoading(false);
    }
  };

  // Upload a new carousel
  const handleNewUpload = async (e) => {
    if (!newLink) {
      setLinkError(true);
      return;
    }
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    formData.append("link", newLink);
    try {
      setLoading(true);
      await axios.post("/api/admin/carousels", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          username: adminUser,
          password: adminPass,
        },
        params: { email: adminEmail },
      });
      fetchCarousels();
    } catch (err) {
      setError("Failed to upload image");
    } finally {
      setLoading(false);
      setNewLink("");
    }
  };

  // Update an existing carousel image
  const handleUpdate = async (carouselId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);

    try {
      setLoading(true);
      await axios.put(`/api/admin/carousels/${carouselId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          username: adminUser,
          password: adminPass,
        },
        params: { email: adminEmail },
      });
      fetchCarousels();
    } catch (err) {
      setError("Failed to update image");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (carouselId) => {
    if (!window.confirm("Are you sure you want to delete this carousel?"))
      return;

    try {
      setLoading(true);
      await axios.delete(`/api/admin/carousels/${carouselId}`, {
        headers: {
          username: adminUser,
          password: adminPass,
        },
        params: { email: adminEmail },
      });
      fetchCarousels();
    } catch (err) {
      console.log(err);
      setError("Failed to delete carousel");
    } finally {
      setLoading(false);
    }
  };

  // Fetch restrictions from the backend
  const fetchRestrictions = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/admin/restrictions", {
        headers: {
          username: adminUser,
          password: adminPass,
        },
        params: { email: adminEmail },
      });
      setRestrictions(res.data.restrictions);
    } catch (err) {
      setError("Failed to load restrictions");
    } finally {
      setLoading(false);
    }
  };

  // Add a new restriction
  const handleAddRestriction = async () => {
    if (!newRestriction) return;
    try {
      setLoading(true);
      await axios.post(
        "/api/admin/addrestriction",
        { name: newRestriction },
        {
          headers: {
            username: adminUser,
            password: adminPass,
          },
          params: { email: adminEmail },
        }
      );
      setNewRestriction("");
      fetchRestrictions();
    } catch (err) {
      setError("Failed to add restriction");
    } finally {
      setLoading(false);
    }
  };

  // Delete a restriction
  const handleDeleteRestriction = async (id) => {
    if (!window.confirm("Are you sure you want to delete this restriction?"))
      return;
    try {
      setLoading(true);
      await axios.post(
        "/api/admin/deleterestriction",
        { id },
        {
          headers: {
            username: adminUser,
            password: adminPass,
          },
          params: { email: adminEmail },
        }
      );
      fetchRestrictions();
    } catch (err) {
      setError("Failed to delete restriction");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchCarousels();
    fetchRestrictions();
  }, []);

  return (
    <main className="py-6">
      <div className="container px-4 mx-auto">
        <div className="p-4 mb-6 bg-gray-800 rounded-xl">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <h2 className="text-xl font-bold text-white"> Manage Carousels</h2>
          </div>
        </div>

        {error && (
          <p className="text-red-500 bg-red-300/10 p-3 py-1 w-max rounded-lg">
            {error}
          </p>
        )}
        {loading && <p className="text-white">Loading...</p>}

        <div className="p-4 my-6 flex flex-wrap gap-4 bg-gray-800 rounded-xl">
          {/* Display Loading or Error Message */}

          {/* Display Carousels */}
          {carousels.map((carousel, index) => (
            <div
              key={index}
              className="w-[15vw] aspect-square relative rounded-lg overflow-hidden"
            >
              <img
                src={carousel.Image}
                alt="Carousel"
                className="object-cover w-full h-full"
              />
              <label className="absolute w-full h-full top-0 left-0 z-[1] bg-black/50 flex items-center justify-center text-white cursor-pointer opacity-0 hover:opacity-100 transition-opacity duration-300">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleUpdate(carousel._id, e)}
                />
                <Repeat size={44} />
              </label>
              <button
                onClick={() => handleDelete(carousel._id)}
                className="absolute bottom-2 right-2 bg-red-600 p-2 rounded-full hover:bg-red-700 transition-colors duration-300 z-[9000000000]"
              >
                <Trash2 size={20} color="white" />
              </button>
            </div>
          ))}

          {/* Upload New Carousel */}
          <div className="w-[15vw] aspect-square relative rounded-lg overflow-hidden">
            <label className="absolute w-full h-full top-0 left-0 z-[1] bg-black/50 flex flex-col gap-4 items-center justify-center text-white cursor-pointer opacity-100 transition-opacity duration-300">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleNewUpload}
              />
              <ArrowUpFromLine size={44} /> Upload New
            </label>
            <div className={`w-full p-2 absolute bottom-1  z-20`}>
              <input
                className={`w-full rounded bg-[#1F2937] text-base text-white p-2 py-1 ${linkerror ? "border border-red-500" : "border-black"}`}
                value={newLink}
                placeholder="Provide a link"
                onChange={(e)=>{
                  setLinkError(false);
                  setNewLink(e.target.value);
                }}
              />
            </div>
          </div>
        </div>
        <div className="p-4 mb-6 bg-gray-800 rounded-xl">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <h2 className="text-xl font-bold text-white">
              {" "}
              Restricted Source list
            </h2>
          </div>
        </div>
        <div className="pl-6 mt-4 space-y-2 bg-gray-800 rounded-xl p-4">
          {/* Display Restrictions */}
          {restrictions.map((restriction, index) => (
            <div
              key={index}
              className="flex items-center justify-between group"
            >
              <span className="text-gray-300 py-1">{restriction.name}</span>
              <button
                onClick={() => handleDeleteRestriction(restriction._id)}
                className="invisible p-1 text-red-500 rounded group-hover:visible hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Add New Restriction */}
          <div className="flex gap-2 mt-4">
            <input
              type="text"
              value={newRestriction}
              onChange={(e) => setNewRestriction(e.target.value)}
              placeholder="Add Source"
              className="flex-1 px-4 py-2 text-white bg-gray-700 rounded focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none"
            />
            <button
              onClick={handleAddRestriction}
              className="px-4 py-2 text-white rounded bg-[#2ab6e4] hover:bg-[#2ab6e4]/80 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
