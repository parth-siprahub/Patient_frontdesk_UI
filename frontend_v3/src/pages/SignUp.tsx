import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity, ArrowLeft, ArrowRight, Check, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { IndianPhoneInput, validateIndianPhone } from "@/components/IndianPhoneInput";

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  role: z.enum(["patient", "front-desk", "doctor"], { required_error: "Please select your role" }),
  age: z.string().refine((val) => {
    const num = parseInt(val);
    return num >= 1 && num <= 120;
  }, "Please enter a valid age"),
  gender: z.string().min(1, "Please select your gender"),
  phone: z.string().refine((val) => validateIndianPhone(val), "Please enter a valid 10-digit Indian mobile number"),
  terms: z.boolean().refine((val) => val === true, "You must accept the terms and privacy policy"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  age: string;
  gender: string;
  phone: string;
  terms: boolean;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const SignUp = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    age: "",
    gender: "",
    phone: "",
    terms: false,
  });
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const { toast } = useToast();

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: FormErrors = {};

    if (currentStep === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
      else if (formData.fullName.length < 2) newErrors.fullName = "Name must be at least 2 characters";

      if (!formData.email.trim()) newErrors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Please enter a valid email";

      if (!formData.role) newErrors.role = "Please select your role";
    }

    if (currentStep === 2) {
      if (!formData.password) newErrors.password = "Password is required";
      else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";

      if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
      else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    }

    if (currentStep === 3) {
      if (!formData.age) newErrors.age = "Age is required";
      else {
        const ageNum = parseInt(formData.age);
        if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) newErrors.age = "Please enter a valid age";
      }

      if (!formData.gender) newErrors.gender = "Please select your gender";

      if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
      else if (!validateIndianPhone(formData.phone)) {
        newErrors.phone = "Please enter a valid 10-digit Indian mobile number";
      }

      if (!formData.terms) newErrors.terms = "You must accept the terms and privacy policy";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      // Only proceed to next step if validation passes
      setStep(step + 1);
    } else {
      // Mark current step fields as touched to show validation errors
      const stepFields: Record<number, (keyof FormData)[]> = {
        1: ["fullName", "email", "role"],
        2: ["password", "confirmPassword"],
        3: ["age", "gender", "phone", "terms"]
      };

      const fieldsToTouch = stepFields[step] || [];
      const newTouched = { ...touched };
      fieldsToTouch.forEach(f => newTouched[f] = true);
      setTouched(newTouched);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(3)) {
      // Mark all step 3 fields as touched to show errors
      setTouched({
        ...touched,
        age: true,
        gender: true,
        phone: true,
        terms: true
      });
      return;
    }

    const result = signUpSchema.safeParse(formData);

    if (!result.success) {
      const zodErrors: FormErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormData;
        zodErrors[field] = err.message;
      });
      setErrors(zodErrors);
      // Mark all fields with errors as touched
      const newTouched = { ...touched };
      Object.keys(zodErrors).forEach(key => {
        newTouched[key as keyof FormData] = true;
      });
      setTouched(newTouched);
      return;
    }

    setIsLoading(true);
    try {
      await signUp(formData);

      toast({
        title: "Account created successfully",
        description: "Please log in with your new credentials.",
      });

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { number: 1, title: "Personal Info" },
    { number: 2, title: "Security" },
    { number: 3, title: "Details" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-accent to-secondary/20 p-12 flex-col justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
            <Activity className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground">NeuroAssist</span>
        </Link>

        <div className="max-w-md">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Join thousands of patients taking control of their health
          </h1>
          <p className="text-muted-foreground text-lg">
            Create your account and start recording symptoms, booking appointments, and connecting with doctors today.
          </p>
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <span>✓ HIPAA Compliant</span>
          <span>✓ 256-bit Encryption</span>
          <span>✓ 24/7 Support</span>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo */}
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
              <Activity className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">NeuroAssist</span>
          </Link>

          <h2 className="text-2xl font-bold text-foreground mb-2">Create your account</h2>
          <p className="text-muted-foreground mb-8">Start your health journey with us</p>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-10">
            {steps.map((s, index) => (
              <div key={s.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${step > s.number
                      ? "bg-primary text-primary-foreground"
                      : step === s.number
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                        : "bg-muted text-muted-foreground"
                      }`}
                  >
                    {step > s.number ? <Check className="w-5 h-5" /> : s.number}
                  </div>
                  <span className={`text-xs mt-2 ${step >= s.number ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 sm:w-24 h-0.5 mx-2 transition-all duration-300 ${step > s.number ? "bg-primary" : "bg-muted"
                    }`} />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    className={errors.fullName ? "border-destructive" : ""}
                  />
                  {touched.fullName && errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {touched.email && errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">I am a</Label>
                  <Select value={formData.role} onValueChange={(value) => updateField("role", value)}>
                    <SelectTrigger className={errors.role ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border border-border z-50">
                      <SelectItem value="patient">Patient</SelectItem>
                      <SelectItem value="front-desk">Front Desk Staff</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                    </SelectContent>
                  </Select>
                  {touched.role && errors.role && (
                    <p className="text-sm text-destructive">{errors.role}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Security */}
            {step === 2 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={formData.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      className={errors.password ? "border-destructive pr-10" : "pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {touched.password && errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField("confirmPassword", e.target.value)}
                      className={errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {touched.confirmPassword && errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Details */}
            {step === 3 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="25"
                      min="1"
                      max="120"
                      value={formData.age}
                      onChange={(e) => updateField("age", e.target.value)}
                      className={errors.age ? "border-destructive" : ""}
                    />
                    {touched.age && errors.age && (
                      <p className="text-sm text-destructive">{errors.age}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => updateField("gender", value)}>
                      <SelectTrigger className={errors.gender ? "border-destructive" : ""}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border border-border z-50">
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    {touched.gender && errors.gender && (
                      <p className="text-sm text-destructive">{errors.gender}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <IndianPhoneInput
                    id="phone"
                    value={formData.phone}
                    onChange={(value) => updateField("phone", value)}
                    error={!!errors.phone}
                  />
                  {touched.phone && errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={formData.terms}
                      onCheckedChange={(checked) => updateField("terms", checked as boolean)}
                      className={errors.terms ? "border-destructive" : ""}
                    />
                    <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                      I agree to the{" "}
                      <a href="#" className="text-primary hover:underline">Terms of Service</a>
                      {" "}and{" "}
                      <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                    </Label>
                  </div>
                  {touched.terms && errors.terms && (
                    <p className="text-sm text-destructive">{errors.terms}</p>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}

              {step < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex-1"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" className="flex-1">
                  Create Account
                </Button>
              )}
            </div>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
