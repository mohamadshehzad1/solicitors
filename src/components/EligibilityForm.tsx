"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Loader2,
  Home,
  Droplets,
  Flame,
  Bug,
  HardHat,
} from "lucide-react";
import { leadFormSchema, type LeadFormData } from "@/lib/validations";
import { submitLeadRequest } from "@/lib/submitLead";
import { useLeadTracking } from "@/lib/useLeadTracking";

const tenancyOptions = [
  {
    value: "council-tenant" as const,
    label: "Council",
    icon: "🏛️",
  },
  {
    value: "housing-association" as const,
    label: "Housing Association",
    icon: "🏢",
  },
  {
    value: "private-tenant" as const,
    label: "Private Landlord",
    icon: "🏠",
  },
];

const disrepairOptions = [
  { id: "mould-damp", label: "Damp & Toxic Black Mould", icon: Droplets },
  { id: "water-leaks", label: "Structural Damage & Leaks", icon: HardHat },
  { id: "broken-heating", label: "Broken Heating Systems / Boilers", icon: Flame },
  { id: "pest-infestation", label: "Pest & Rodent Infestations", icon: Bug },
];

const reportedOptions = [
  {
    value: "yes-over-21-days" as const,
    label: "Yes, over 21 days ago",
    description: "I reported this issue to my landlord more than 3 weeks ago",
  },
  {
    value: "yes-recently" as const,
    label: "Yes, recently",
    description: "I reported this issue within the last 3 weeks",
  },
  {
    value: "no" as const,
    label: "No, not yet",
    description: "I haven't reported this to my landlord yet",
  },
];

export default function EligibilityForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const tracking = useLeadTracking();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      disrepairIssues: [],
      gdprConsent: undefined as unknown as true,
      website: "",
    },
  });

  const tenancyType = watch("tenancyType");
  const disrepairIssues = watch("disrepairIssues");

  const toggleDisrepairIssue = (issueId: string) => {
    const current = disrepairIssues || [];
    const updated = current.includes(issueId)
      ? current.filter((id) => id !== issueId)
      : [...current, issueId];
    setValue("disrepairIssues", updated, { shouldValidate: true });
  };

  const onSubmit = async (data: LeadFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await submitLeadRequest({
        ...data,
        ...tracking,
        formSource: "homepage-eligibility-form",
      });

      if (result.ok) {
        // Only swap to the success state once the lead has actually been sent.
        setIsSubmitted(true);
        return;
      }

      // Surface server-side validation on the field that caused it, and keep
      // the form intact so the visitor can correct and retry.
      for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
        const message = Array.isArray(messages) ? messages[0] : undefined;
        if (message) {
          setError(field as keyof LeadFormData, { type: "server", message });
        }
      }

      setSubmitError(result.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const canProceed = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!tenancyType;
      case 2:
        return (disrepairIssues?.length || 0) > 0;
      case 3:
        return !!watch("issueReported");
      case 4:
        return true;
      default:
        return false;
    }
  };

  const progressPercent = ((currentStep - 1) / 3) * 100;

  if (isSubmitted) {
    return (
      <div className="card max-w-lg mx-auto text-center py-12 px-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Check className="h-8 w-8 text-gold-600" />
        </motion.div>
        <h3 className="text-2xl font-bold text-navy-900 mb-3">
          Thank You!
        </h3>
        <p className="text-navy-600 mb-6">
          Your eligibility check has been submitted. A member of our team will
          contact you within 24 hours to discuss your claim.
        </p>
        <p className="text-sm text-navy-500">
          Check your email for a confirmation with reference details.
        </p>
      </div>
    );
  }

  return (
    <div id="eligibility-form" className="scroll-mt-24">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-navy-900 mb-3">
            Start Your Housing Disrepair Claim
          </h2>
          <p className="text-navy-600">
            Answer a few quick questions to find out if you qualify for
            compensation
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 px-4">
          <div className="flex items-center justify-between mb-3">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`text-xs font-semibold transition-colors duration-300 ${
                  currentStep >= step ? "text-gold-600" : "text-slate-400"
                }`}
              >
                Step {step}
              </div>
            ))}
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gold-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Hidden anti-spam field: visually hidden via the same `sr-only`
              utility already used by the radio inputs above, never announced
              to assistive tech and skipped by tab order. Real visitors leave
              it empty; anything submitted in it is rejected server-side. */}
          <div className="sr-only" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input
              type="text"
              id="website"
              tabIndex={-1}
              autoComplete="off"
              {...register("website")}
            />
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8 min-h-[400px]">
            <AnimatePresence mode="wait">
              {/* Step 1: Tenancy Type */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-xl font-bold text-navy-900 mb-2">
                    Who do you rent from? <span className="text-red-500">*</span>
                  </h3>
                  <p className="text-navy-500 text-sm mb-8">
                    This helps us determine the best route for your claim
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {tenancyOptions.map((option) => (
                      <label
                        key={option.value}
                        className={`relative flex flex-col items-center gap-3 p-6 border-2 rounded-2xl cursor-pointer transition-all duration-200 text-center ${
                          tenancyType === option.value
                            ? "border-gold-500 bg-gold-50 shadow-md"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          value={option.value}
                          {...register("tenancyType")}
                          className="sr-only"
                        />
                        <span className="text-3xl">{option.icon}</span>
                        <span className="font-semibold text-navy-900 text-sm">
                          {option.label}
                        </span>
                        {tenancyType === option.value && (
                          <div className="absolute top-3 right-3 w-6 h-6 bg-gold-500 rounded-full flex items-center justify-center">
                            <Check className="h-3.5 w-3.5 text-white" />
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                  {errors.tenancyType && (
                    <p className="error-text mt-4 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.tenancyType.message}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Step 2: Disrepair Issues */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-xl font-bold text-navy-900 mb-2">
                    What disrepair issues are you experiencing?
                  </h3>
                  <p className="text-navy-500 text-sm mb-8">
                    Select all that apply to your property
                  </p>
                  <div className="space-y-3">
                    {disrepairOptions.map((option) => {
                      const isSelected = disrepairIssues?.includes(option.id);
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => toggleDisrepairIssue(option.id)}
                          className={`w-full flex items-center gap-4 p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                            isSelected
                              ? "border-gold-500 bg-gold-50"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              isSelected
                                ? "bg-gold-500 text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-navy-900">
                              {option.label}
                            </div>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                              isSelected
                                ? "border-gold-500 bg-gold-500"
                                : "border-slate-300"
                            }`}
                          >
                            {isSelected && (
                              <Check className="h-4 w-4 text-white" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {errors.disrepairIssues && (
                    <p className="error-text mt-4 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.disrepairIssues.message}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Step 3: Issue Reported */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-xl font-bold text-navy-900 mb-2">
                    Have you reported this to your landlord?
                  </h3>
                  <p className="text-navy-500 text-sm mb-8">
                    Reporting the issue is an important step in your claim
                  </p>
                  <div className="space-y-3">
                    {reportedOptions.map((option) => {
                      const currentValue = watch("issueReported");
                      return (
                        <label
                          key={option.value}
                          className={`flex items-start gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                            currentValue === option.value
                              ? "border-gold-500 bg-gold-50"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="radio"
                            value={option.value}
                            {...register("issueReported")}
                            className="sr-only"
                          />
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                              currentValue === option.value
                                ? "border-gold-500"
                                : "border-slate-300"
                            }`}
                          >
                            {currentValue === option.value && (
                              <div className="w-2.5 h-2.5 bg-gold-500 rounded-full" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-navy-900">
                              {option.label}
                            </div>
                            <div className="text-sm text-navy-500 mt-0.5">
                              {option.description}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {errors.issueReported && (
                    <p className="error-text mt-4 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.issueReported.message}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Step 4: Contact Details */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-xl font-bold text-navy-900 mb-2">
                    Your Contact Details
                  </h3>
                  <p className="text-navy-500 text-sm mb-6">
                    We&apos;ll use these to contact you about your claim
                  </p>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label-text">First Name</label>
                        <input
                          type="text"
                          {...register("firstName")}
                          className="input-field"
                          placeholder="John"
                        />
                        {errors.firstName && (
                          <p className="error-text">
                            {errors.firstName.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="label-text">Last Name</label>
                        <input
                          type="text"
                          {...register("lastName")}
                          className="input-field"
                          placeholder="Smith"
                        />
                        {errors.lastName && (
                          <p className="error-text">
                            {errors.lastName.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="label-text">UK Phone Number</label>
                      <input
                        type="tel"
                        {...register("phone")}
                        className="input-field"
                        placeholder="07700 900 000"
                      />
                      {errors.phone && (
                        <p className="error-text">{errors.phone.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="label-text">Email Address</label>
                      <input
                        type="email"
                        {...register("email")}
                        className="input-field"
                        placeholder="john@example.co.uk"
                      />
                      {errors.email && (
                        <p className="error-text">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="label-text">Address</label>
                      <input
                        type="text"
                        {...register("address")}
                        className="input-field"
                        placeholder="123 Example Street, Manchester"
                      />
                      {errors.address && (
                        <p className="error-text">
                          {errors.address.message}
                        </p>
                      )}
                    </div>

                    <div className="pt-2">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          {...register("gdprConsent")}
                          className="mt-1 w-4 h-4 text-gold-600 border-slate-300 rounded focus:ring-gold-500"
                        />
                        <span className="text-sm text-navy-600">
                          I consent to The Compensation People processing my
                          personal data to handle my housing disrepair enquiry.
                          I understand my data will be shared with regulated
                          panel solicitors for the purpose of pursuing my claim.
                          View our{" "}
                          <a
                            href="#"
                            className="text-gold-600 hover:underline font-medium"
                          >
                            Privacy Policy
                          </a>
                          .
                        </span>
                      </label>
                      {errors.gdprConsent && (
                        <p className="error-text mt-1">
                          {errors.gdprConsent.message}
                        </p>
                      )}
                    </div>

                    
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {submitError && (
            <p
              role="alert"
              className="error-text flex items-center gap-1 mt-4 justify-end"
            >
              <AlertCircle className="h-4 w-4" />
              {submitError}
            </p>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-2 px-6 py-3 text-navy-600 hover:text-navy-900 font-semibold transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
                Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!canProceed(currentStep)}
                className={`flex items-center gap-2 px-8 py-3 rounded-full font-semibold transition-all duration-200 ${
                  canProceed(currentStep)
                    ? "bg-gold-500 text-white hover:bg-gold-600 shadow-lg hover:shadow-xl"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                Continue
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-gold-500 text-white font-bold rounded-full hover:bg-gold-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Free Check
                    <Check className="h-5 w-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
