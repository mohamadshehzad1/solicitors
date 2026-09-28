"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import PillarNav, { Breadcrumbs } from "@/components/PillarNav";
import Footer from "@/components/Footer";
import { submitLeadRequest } from "@/lib/submitLead";
import { useLeadTracking } from "@/lib/useLeadTracking";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Loader2,
  Phone,
  ArrowRight,
} from "lucide-react";

const quoteSchema = z.object({
  tenancyType: z.enum(["council-tenant", "housing-association", "private-tenant"], {
    required_error: "Please select your tenancy type",
  }),
  disrepairIssues: z.array(z.string()).min(1, "Select at least one issue"),
  issueReported: z.enum(["yes-over-21-days", "yes-recently", "no"], {
    required_error: "Please tell us if this has been reported",
  }),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid UK phone number").regex(/^(\+44|0)\d{10}$/, "Enter a valid UK phone number"),
  email: z.string().email("Please enter a valid email address"),
  address: z.string().min(5, "Please enter your full address").max(200, "Address must be less than 200 characters"),
  description: z.string().min(10, "Please describe your issue in at least 10 characters"),
  gdprConsent: z.literal(true, { errorMap: () => ({ message: "You must consent to proceed" }) }),
  // Hidden anti-spam honeypot. Must stay empty on a genuine submission.
  website: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

const tenancyOptions = [
  { value: "council-tenant" as const, label: "Council Tenant" },
  { value: "housing-association" as const, label: "Housing Association" },
  { value: "private-tenant" as const, label: "Private Tenant" },
];

const issueOptions = [
  { id: "damp-mould", label: "Damp & Mould" },
  { id: "heating", label: "Broken Heating / Boiler" },
  { id: "structural", label: "Structural Damage" },
  { id: "pest", label: "Pest Infestation" },
  { id: "leaks", label: "Water Leaks / Plumbing" },
];

const reportedOptions = [
  { value: "yes-over-21-days" as const, label: "Yes, over 21 days ago" },
  { value: "yes-recently" as const, label: "Yes, recently" },
  { value: "no" as const, label: "No, not yet" },
];

export default function QuoteFormPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const tracking = useLeadTracking();

  const { register, handleSubmit, watch, setValue, setError, formState: { errors } } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: { disrepairIssues: [], website: "" },
  });

  const tenancyType = watch("tenancyType");
  const disrepairIssues = watch("disrepairIssues");

  const toggleIssue = (id: string) => {
    const current = disrepairIssues || [];
    const updated = current.includes(id) ? current.filter((i) => i !== id) : [...current, id];
    setValue("disrepairIssues", updated, { shouldValidate: true });
  };

  const onSubmit = async (data: QuoteFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await submitLeadRequest({
        ...data,
        ...tracking,
        formSource: "quote-form",
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
          setError(field as keyof QuoteFormData, { type: "server", message });
        }
      }

      setSubmitError(result.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = (s: number): boolean => {
    if (s === 1) return !!tenancyType;
    if (s === 2) return (disrepairIssues?.length || 0) > 0;
    if (s === 3) return !!watch("issueReported");
    return true;
  };

  if (isSubmitted) {
    return (
      <main className="min-h-screen bg-slate-50">
        <PillarNav />
        <div className="container-custom py-24 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-gold-600" />
          </motion.div>
          <h1 className="text-3xl font-bold text-navy-900 mb-4">Quote Request Submitted</h1>
          <p className="text-navy-600 max-w-lg mx-auto mb-8">
            Thank you. A member of our team will contact you within 24 hours with a personalised assessment.
          </p>
          <Link href="/housing-disrepair-claims" className="inline-flex items-center gap-2 btn-gold">
            Back to Claims Info
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <PillarNav />
      <div className="container-custom">
        <Breadcrumbs items={[{ label: "Contact", href: "/contact/quote-form" }, { label: "Get a Quote" }]} />

        <div className="max-w-3xl mx-auto py-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-navy-900 mb-4 text-center">
            Get Your Free Quote
          </h1>
          <p className="text-navy-600 text-center mb-8">
            Answer a few questions and we&apos;ll provide a personalised assessment of your claim.
          </p>

          {/* Progress */}
          <div className="flex items-center justify-between mb-8 px-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                  step > s ? "bg-gold-500 text-white" : step === s ? "bg-gold-500 text-white ring-4 ring-gold-100" : "bg-slate-200 text-slate-400"
                }`}>
                  {step > s ? <Check className="h-5 w-5" /> : s}
                </div>
                {s < 4 && <div className={`hidden sm:block w-16 md:w-24 h-1 mx-2 transition-all ${step > s ? "bg-gold-500" : "bg-slate-200"}`} />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Hidden anti-spam field: visually hidden via the `sr-only`
                utility already used by the radio inputs below, never announced
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
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8 min-h-[350px]">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h3 className="text-xl font-bold text-navy-900 mb-6">Who do you rent from? <span className="text-red-500">*</span></h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {tenancyOptions.map((opt) => (
                        <label key={opt.value} className={`flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all font-semibold text-sm ${tenancyType === opt.value ? "border-gold-500 bg-gold-50 text-gold-700" : "border-slate-200 hover:border-slate-300 text-navy-700"}`}>
                          <input type="radio" value={opt.value} {...register("tenancyType")} className="sr-only" />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                    {errors.tenancyType && <p className="error-text flex items-center gap-1 mt-3"><AlertCircle className="h-4 w-4" />{errors.tenancyType.message}</p>}
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h3 className="text-xl font-bold text-navy-900 mb-6">What issues are you experiencing?</h3>
                    <div className="space-y-2">
                      {issueOptions.map((opt) => {
                        const sel = disrepairIssues?.includes(opt.id);
                        return (
                          <button key={opt.id} type="button" onClick={() => toggleIssue(opt.id)} className={`w-full flex items-center justify-between p-4 border-2 rounded-xl text-left transition-all font-medium ${sel ? "border-gold-500 bg-gold-50" : "border-slate-200 hover:border-slate-300"}`}>
                            {opt.label}
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${sel ? "border-gold-500 bg-gold-500" : "border-slate-300"}`}>
                              {sel && <Check className="h-3 w-3 text-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {errors.disrepairIssues && <p className="error-text flex items-center gap-1 mt-3"><AlertCircle className="h-4 w-4" />{errors.disrepairIssues.message}</p>}
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h3 className="text-xl font-bold text-navy-900 mb-6">Have you reported this to your landlord?</h3>
                    <div className="space-y-2">
                      {reportedOptions.map((opt) => {
                        const cur = watch("issueReported");
                        return (
                          <label key={opt.value} className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all font-medium ${cur === opt.value ? "border-gold-500 bg-gold-50" : "border-slate-200 hover:border-slate-300"}`}>
                            <input type="radio" value={opt.value} {...register("issueReported")} className="sr-only" />
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${cur === opt.value ? "border-gold-500" : "border-slate-300"}`}>
                              {cur === opt.value && <div className="w-2.5 h-2.5 bg-gold-500 rounded-full" />}
                            </div>
                            {opt.label}
                          </label>
                        );
                      })}
                    </div>
                    {errors.issueReported && <p className="error-text flex items-center gap-1 mt-3"><AlertCircle className="h-4 w-4" />{errors.issueReported.message}</p>}
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h3 className="text-xl font-bold text-navy-900 mb-6">Your Details</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="label-text">First Name</label><input {...register("firstName")} className="input-field" placeholder="John" />{errors.firstName && <p className="error-text">{errors.firstName.message}</p>}</div>
                        <div><label className="label-text">Last Name</label><input {...register("lastName")} className="input-field" placeholder="Smith" />{errors.lastName && <p className="error-text">{errors.lastName.message}</p>}</div>
                      </div>
                      <div><label className="label-text">Phone</label><input {...register("phone")} className="input-field" placeholder="07700 900 000" />{errors.phone && <p className="error-text">{errors.phone.message}</p>}</div>
                      <div><label className="label-text">Email</label><input {...register("email")} className="input-field" placeholder="john@example.co.uk" />{errors.email && <p className="error-text">{errors.email.message}</p>}</div>
                      <div><label className="label-text">Address</label><input {...register("address")} className="input-field" placeholder="123 Example Street, Manchester" />{errors.address && <p className="error-text">{errors.address.message}</p>}</div>
                      <div><label className="label-text">Describe Your Issue</label><textarea {...register("description")} className="input-field" rows={3} placeholder="Tell us about the disrepair in your home..." />{errors.description && <p className="error-text">{errors.description.message}</p>}</div>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input type="checkbox" {...register("gdprConsent")} className="mt-1 w-4 h-4 text-gold-600 border-slate-300 rounded focus:ring-gold-500" />
                        <span className="text-sm text-navy-600">I consent to The Compensation People processing my data. View our <a href="#" className="text-gold-600 hover:underline">Privacy Policy</a>.</span>
                      </label>
                      {errors.gdprConsent && <p className="error-text">{errors.gdprConsent.message}</p>}
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

            <div className="flex justify-between mt-6">
              {step > 1 ? <button type="button" onClick={() => setStep(step - 1)} className="flex items-center gap-2 px-6 py-3 text-navy-600 hover:text-navy-900 font-semibold"><ChevronLeft className="h-5 w-5" />Back</button> : <div />}
              {step < 4 ? (
                <button type="button" onClick={() => setStep(step + 1)} disabled={!canProceed(step)} className={`flex items-center gap-2 px-8 py-3 rounded-full font-semibold transition-all ${canProceed(step) ? "bg-gold-500 text-white hover:bg-gold-600 shadow-lg" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
                  Continue <ChevronRight className="h-5 w-5" />
                </button>
              ) : (
                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-8 py-3 bg-gold-500 text-white font-bold rounded-full hover:bg-gold-600 transition-all shadow-lg disabled:opacity-50">
                  {isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin" />Submitting...</> : <>Submit <Check className="h-5 w-5" /></>}
                </button>
              )}
            </div>
          </form>

          <div className="mt-8 text-center">
            <a href="tel:+443301233309" className="inline-flex items-center gap-2 text-navy-600 hover:text-gold-600 font-semibold">
              <Phone className="h-4 w-4" />
              Prefer to call? 0330 123 3309
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
