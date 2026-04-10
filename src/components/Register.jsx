"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import { User, Mail, Phone, Briefcase, Building2, Loader } from "lucide-react";
import TNCModal from "./TNCModal";
import { registerUser, setUserPassword } from "@/lib/auth-api";
import { setCurrentUser } from "@/store/services/userService";
import { useDispatch, useSelector } from "react-redux";
import { setUserData } from "@/app/lib/auth";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { fontSizes, logoSizeRatio } from "@/app/lib/data/font_size";
import { setContent } from "@/store/services/contentService";
import { setPortal } from "@/store/services/portalService";
import Button from "./Common/Elements/Button";

const Register = () => {
  const router = useRouter();
  const params = useParams();
  const dispatch = useDispatch();
  // State for step management
  const [currentStep, setCurrentStep] = useState(1);

  // State for company selection
  const [companyInput, setCompanyInput] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ndaPages, setNdaPages] = useState([]);
  const [tncPage, setTncPage] = useState(null);
  const [isNdaPagesLoading, setIsNdaPagesLoading] = useState(false);
  const { data: config } = useSelector((state) => state.portal);
  const { data: content } = useSelector((state) => state.content);

  const filterTheme = (title) => {
    const contentItem =
      content && content?.portalContent?.find((item) => item.title === title);
    let fontSize = fontSizes.find((item) => item.key === title);
    let theme = contentItem
      ? contentItem.theme
      : {
          fontSize: fontSize?.size,
          color: "#000000",
          fontWeight: title === "Paragraph" ? 300 : 400,
        };
    return theme;
  };

  const LogoImage = () => {
    const baseSize = 100; // Set a reasonable base size (in pixels)

    const logoSize =
      (filterTheme("Logo")?.fontSize &&
        logoSizeRatio[filterTheme("Logo")?.fontSize]) ||
      logoSizeRatio.medium;
    return (
      <div className="block min-w-16">
        <img
          src={config?.logo || "/logo.png"}
          alt={params.portalid}
          className="object-contain mr-2"
          style={{
            height: `${baseSize * logoSize}px`,
            width: "auto",
            maxWidth: "100%",
          }}
        />
      </div>
    );
  };

  // State for user details
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    title: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
    emailNotifications: false,
  });

  // State for registered user data
  const [registeredUserId, setRegisteredUserId] = useState(null);

  // State for TNC Modal
  const [showTNCModal, setShowTNCModal] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

  // State for form validation
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Mock companies data - replace with actual API call
  const mockCompanies = [
    { id: 1, name: "Mstratrgy" },
    { id: 2, name: "Google LLC" },
    { id: 3, name: "Apple Inc." },
    { id: 4, name: "Amazon.com Inc." },
    { id: 5, name: "Meta Platforms Inc." },
    { id: 6, name: "Tesla Inc." },
    { id: 7, name: "Netflix Inc." },
    { id: 8, name: "Adobe Inc." },
    { id: 9, name: "Salesforce Inc." },
    { id: 10, name: "Oracle Corporation" },
  ];

  // Filter companies based on input
  useEffect(() => {
    if (companyInput.trim() === "") {
      setFilteredCompanies([]);
      setShowCompanyDropdown(false);
    } else {
      const filtered = mockCompanies.filter((company) =>
        company.name.toLowerCase().includes(companyInput.toLowerCase()),
      );
      const filteredWithoutSelected = selectedCompany
        ? filtered.filter((company) => company.id !== selectedCompany.id)
        : filtered;
      const isExactSelected =
        !!selectedCompany &&
        selectedCompany.name.toLowerCase() === companyInput.toLowerCase();

      setFilteredCompanies(filteredWithoutSelected);
      setShowCompanyDropdown(
        !isExactSelected && filteredWithoutSelected.length > 0,
      );
    }
  }, [companyInput, selectedCompany]);

  // Handle company input change
  const handleCompanyInputChange = (e) => {
    const value = e.target.value;
    setCompanyInput(value);
    setSelectedCompany(null);
  };

  // Handle company selection from dropdown
  const handleCompanySelect = (company) => {
    setCompanyInput(company.name);
    setSelectedCompany(company);
    setShowCompanyDropdown(false);
  };

  // Handle proceeding to step 2
  const handleProceedToStep2 = () => {
    if (!companyInput.trim()) {
      toast.error("Please enter or select a company name");
      return;
    }
    setCurrentStep(2);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handle field blur
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, e.target.value);
  };

  // Validate individual field
  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "firstName":
        if (!value.trim()) error = "First name is required";
        break;
      case "lastName":
        if (!value.trim()) error = "Last name is required";
        break;
      case "email":
        if (!value.trim()) error = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(value)) error = "Email is invalid";
        break;
      case "title":
        // Title is optional - no validation required
        break;
      case "password":
        if (!value.trim()) error = "Password is required";
        else if (value.length < 8)
          error = "Password must be at least 8 characters";
        else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value))
          error = "Password must contain uppercase, lowercase, and number";
        break;
      case "confirmPassword":
        if (!value.trim()) error = "Please confirm your password";
        else if (value !== formData.password) error = "Passwords do not match";
        break;
      case "termsAccepted":
        if (!value) error = "You must agree to terms and conditions";
        break;
      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    return error;
  };

  // Validate entire form
  // Handle user details registration (Step 2)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate only user details fields (not password yet)
    const newErrors = {};

    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";
    if (!formData.termsAccepted)
      newErrors.termsAccepted = "You must agree to terms and conditions";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({
        firstName: true,
        lastName: true,
        email: true,
        termsAccepted: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      // Registration API call
      const registrationData = {
        companyName: selectedCompany?.name || companyInput,
        companyId: selectedCompany?.id || null,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        title: formData.title,
        portal: params?.portalid || "root",
      };

      const response = await registerUser(registrationData);
      dispatch(
        setCurrentUser({ ...response.user, portalId: params?.portalid }),
      );
      setUserData({ ...response.user, portalId: params?.portalid });
      // localStorage.setItem("portal", params?.portalid);
      localStorage.setItem("accessToken", response.accessToken);

      // Store user ID for password step
      setRegisteredUserId(response.user.id);

      // Move to step 3 (password)
      setCurrentStep(3);
      toast.success("Registration successful! Please set your password.");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password setting (Step 3)
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // Validate password fields
    const newErrors = {};

    if (!formData.password.trim()) newErrors.password = "Password is required";
    else if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password))
      newErrors.password =
        "Password must contain uppercase, lowercase, and number";
    if (!formData.confirmPassword.trim())
      newErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({
        password: true,
        confirmPassword: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      // Save password API call
      const passwordData = {
        userId: registeredUserId,
        password: formData.password,
      };

      const response = await setUserPassword(
        registeredUserId,
        formData.password,
      );

      // Set registered user data for TNC modal
      setRegisteredUser(response.user);
      setShowTNCModal(true);
      toast.success("Password set successfully!");
    } catch (error) {
      console.error("Password save error:", error);
      toast.error(
        error.message || "Failed to save password. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNdaPages = async () => {
    setIsNdaPagesLoading(true);
    try {
      const response = await fetchWrapper(
        `/api/nda-agreements?portalId=${params?.portalid || "root"}`,
        {},
        "fetch-nda-agreements",
      );
      if (!response.ok) {
        setNdaPages([]);
        setTncPage(null);
        return;
      }
      const data = await response.json();
      const pages = data?.data || [];
      setNdaPages(pages);
      setTncPage(pages.find((page) => page?.isDefault) || null);
    } catch (error) {
      console.error("Error fetching NDA pages:", error);
      setNdaPages([]);
      setTncPage(null);
    } finally {
      setIsNdaPagesLoading(false);
    }
  };

  useEffect(() => {
    const fetchConfig = async () => {
      dispatch(setPortal(params.portalid || "root"));
    };
    const fetchContent = async () => {
      dispatch(setContent(params?.portalid || "root"));
    };
    fetchConfig();
    fetchContent();
    fetchNdaPages();
  }, []);

  // Handle TNC modal close
  const handleTNCModalClose = () => {
    setShowTNCModal(false);
  };

  // Handle going back to step 1
  const handleBackToStep1 = () => {
    setCurrentStep(1);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      title: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false,
      emailNotifications: false,
    });
    setErrors({});
    setTouched({});
    setRegisteredUserId(null);
  };

  if (isNdaPagesLoading) {
    return (
      <div className="flex items-center justify-center bg-white h-screen">
        <Loader className="w-5 h-5 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 bg-gray-50 overflow-y-auto shadow-md border-b lg:border-b-0 lg:border-r border-gray-200">
          <div className="min-h-full flex items-center justify-center p-6 sm:px-8 lg:px-10">
            <div className="w-full max-w-4xl bg-white rounded-lg border border-gray-200 p-6 sm:p-12">
              {/* Logo */}
              <div className="flex items-center mb-6">
                <LogoImage />
              </div>

              {/* Heading */}
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
                Create your account
              </h1>
              {/* Step 1: Company Selection */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                      Select Your Company
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Search for your company or enter a new company name
                    </p>
                  </div>

                  {/* Company Input with Autocomplete */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Company Name<span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building2 className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={companyInput}
                        onChange={handleCompanyInputChange}
                        onFocus={() => {
                          const isExactSelected =
                            !!selectedCompany &&
                            selectedCompany.name.toLowerCase() ===
                              companyInput.toLowerCase();
                          if (companyInput.trim() && !isExactSelected) {
                            setShowCompanyDropdown(true);
                          }
                        }}
                        placeholder="Type to search or enter company name"
                        className="w-full pl-10 pr-10 py-2.5 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      />
                      {companyInput && (
                        <button
                          type="button"
                          onClick={() => {
                            setCompanyInput("");
                            setSelectedCompany(null);
                            setShowCompanyDropdown(false);
                          }}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          <span className="text-gray-400 hover:text-gray-600">
                            ×
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Dropdown Suggestions */}
                    {showCompanyDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {filteredCompanies.length > 0 ? (
                          filteredCompanies.map((company) => (
                            <button
                              key={company.id}
                              type="button"
                              onClick={() => handleCompanySelect(company)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                            >
                              <Building2 className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-800">
                                {company.name}
                              </span>
                            </button>
                          ))
                        ) : !selectedCompany ||
                          selectedCompany.name.toLowerCase() !==
                            companyInput.toLowerCase() ? (
                          <div className="px-4 py-3 text-gray-500 text-center">
                            No companies found. You can enter a new company
                            name.
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleProceedToStep2}
                    disabled={!companyInput.trim()}
                    type={"Primary"}
                    className={"w-full"}
                    label={"Proceed to Registration"}
                  />

                  <div className="text-center text-sm text-gray-600">
                    You have an account?{" "}
                    <span
                      className="text-blue-600 hover:underline cursor-pointer"
                      onClick={() =>
                        router.push(
                          params?.portalid
                            ? `/${params.portalid}/login`
                            : "/login",
                        )
                      }
                    >
                      Login here
                    </span>
                  </div>
                </div>
              )}

              {/* Step 2: User Details */}
              {currentStep === 2 && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* First Name and Last Name Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          First Name<span className="text-red-500">*</span>
                        </div>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="Enter your first name"
                        className={`w-full text-gray-600 px-3 py-1.5 border rounded-[4px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                          errors.firstName && touched.firstName
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors.firstName && touched.firstName && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.firstName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          Last Name<span className="text-red-500">*</span>
                        </div>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="Enter your last name"
                        className={`w-full text-gray-600 px-3 py-1.5 border rounded-[4px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                          errors.lastName && touched.lastName
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors.lastName && touched.lastName && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Email and Phone Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          E-mail<span className="text-red-500">*</span>
                        </div>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="Enter your email"
                        className={`w-full text-gray-600 px-3 py-1.5 border rounded-[4px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                          errors.email && touched.email
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors.email && touched.email && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          Phone No
                        </div>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter your phone number"
                        className="w-full text-gray-600 px-3 py-1.5 border border-gray-300 rounded-[4px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Title Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        Title
                      </div>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter your job title (optional)"
                      className="w-full text-gray-600 px-3 py-1.5 border border-gray-300 rounded-[4px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                  </div>

                  {/* Company Display (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        Company
                      </div>
                    </label>
                    <input
                      type="text"
                      value={selectedCompany?.name || companyInput}
                      readOnly
                      className="w-full text-gray-600 px-3 py-1.5 border border-gray-200 rounded-[4px] bg-gray-100 outline-none"
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-3">
                    <div>
                      <label className="flex items-start cursor-pointer">
                        <input
                          type="checkbox"
                          name="termsAccepted"
                          checked={formData.termsAccepted}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          I agree to the{" "}
                          <span className="text-blue-600 hover:underline">
                            Terms and Conditions
                          </span>{" "}
                          and{" "}
                          <span className="text-blue-600 hover:underline">
                            Privacy Policy
                          </span>
                          .
                        </span>
                      </label>
                      {errors.termsAccepted && touched.termsAccepted && (
                        <p className="text-red-500 text-xs mt-1 ml-6">
                          {errors.termsAccepted}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    <Button
                      onClick={handleBackToStep1}
                      type={"Secondary"}
                      label={"Back"}
                      className={"flex-1"}
                    />
                    <Button
                      onClick={handleSubmit}
                      type={"Primary"}
                      label={"Register"}
                      className={"flex-1"}
                      disabled={isLoading || !formData.termsAccepted}
                      isLoading={isLoading}
                    />
                  </div>
                </form>
              )}

              {/* Step 3: Set Password */}
              {currentStep === 3 && (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                      Set Your Password
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Create a secure password for your account
                    </p>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Password<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="Enter your password"
                      className={`w-full text-gray-600 px-3 py-1.5 border rounded-[4px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                        errors.password && touched.password
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {errors.password && touched.password && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.password}
                      </p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      Must be at least 8 characters with uppercase, lowercase,
                      and numbers
                    </p>
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Confirm Password<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="Confirm your password"
                      className={`w-full text-gray-600 px-3 py-1.5 border rounded-[4px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                        errors.confirmPassword && touched.confirmPassword
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {errors.confirmPassword && touched.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  {/* User Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Account Summary
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-bold">Name:</span>{" "}
                        {formData.firstName} {formData.lastName}
                      </p>
                      <p>
                        <span className="font-bold">Email:</span>{" "}
                        {formData.email}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    <Button
                      onClick={handlePasswordSubmit}
                      type={"Primary"}
                      label={"Save Password"}
                      className={"flex-1"}
                      disabled={isLoading}
                      isLoading={isLoading}
                    />
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TNC Modal */}
      {showTNCModal && registeredUser && (
        <TNCModal
          onClose={handleTNCModalClose}
          user={registeredUser}
          email={formData.email}
          page={tncPage}
        />
      )}
    </>
  );
};

export default Register;
