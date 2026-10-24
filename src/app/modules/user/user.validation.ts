import { z } from "zod";
import { USER_ROLES, USER_STATUS } from "./user.interface";
import { EducationSchema, PortfolioSchema, SalaryExpectationUpdateSchema, WorkExperienceUpdateSchema } from "../applicantProfile/applicantProfile.validation";

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  '10minutemail.com',
  'tempmail.com',
  'sharklasers.com',
  'trashmail.com',
  'yopmail.com',
  'dispostable.com',
  'temp-mail.org',
  'fakeinbox.com',
  'mohmal.com',
  'getairmail.com',
  'crazymailing.com',
  'throwawaymail.com',
  'mailcatch.com',
  'maildrop.cc',
])

const nameRegex = /^[a-zA-ZÀ-ÿ\u00C0-\u024F\u0600-\u06FF\s.'-]+$/

export const safeNameValidation = z
  .string({ required_error: 'Name is required' })
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(60, 'Name cannot exceed 60 characters')
  .refine(val => nameRegex.test(val), {
    message: 'Name can only contain alphabetic letters, spaces, dots, and hyphens.',
  })
  .refine(
    val => !/https?:\/\/|bit\.ly|t\.me|wa\.me|www\.|\.com|\.org|\.net|\.io/i.test(val),
    {
      message: 'Name cannot contain web links or URLs.',
    },
  )
  .refine(
    val => !/bonus|lira|free spins|\bfs\b|casino|betting|oyna|bekliyor/i.test(val),
    {
      message: 'Name contains disallowed terms.',
    },
  )

export const safeEmailValidation = z
  .string({ required_error: 'Email is required' })
  .email('Invalid email format')
  .toLowerCase()
  .trim()
  .refine(
    email => {
      const domain = email.split('@')[1]
      return !domain || !DISPOSABLE_EMAIL_DOMAINS.has(domain.toLowerCase())
    },
    {
      message: 'Temporary or disposable email domains are not allowed.',
    },
  )

export const userSignupSchema = z.object({
 body: z.object({
  email: safeEmailValidation,
  name: safeNameValidation,
  companyName: z.string().optional(),
  role: z.nativeEnum(USER_ROLES),
  image: z.string().optional(),
  password: z.string().min(6),
  coordinates: z.array(z.number()).optional(),
  honeypot: z.string().optional(),
 })
});

export const userLoginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
});

export const userUpdateSchema = z.object({
  email: safeEmailValidation.optional(),
  name: safeNameValidation.optional(),
  password: z.string().min(6).optional(),
  status: z.nativeEnum(USER_STATUS).optional(),
  verified: z.boolean().optional(),
  companyName: z.string().optional(),
  role: z.nativeEnum(USER_ROLES).optional(),
  image: z.string().optional(),
  coordinates: z.array(z.number()).optional(),
});


// Simple merged schema (recommended for common API)
export const UniversalProfileUpdateSchema = z.object({
  body: z.object({
    // Common fields that might overlap
    bio: z.string().max(5000, "Bio cannot exceed 500 characters").optional(),
    location: z.string().optional(),
    phone: z.string().optional(),
    mobile: z.string().optional(),
    image: z.string().optional(),
    coordinates: z.array(z.number()).optional(),
    // Applicant fields (all optional)
    resume: z.string().optional(),
    skills: z.array(z.string()).optional(),
    expartes: z.array(z.string()).optional(),
    education: z.array(EducationSchema).optional(),
    workExperience: z.array(WorkExperienceUpdateSchema).optional(),
    portfolio: z.array(PortfolioSchema).optional(),
    preferredWorkType: z.enum(["Full-time", "Part-time", "Temp", "Self-employed", "Chair-rental"]).optional(),
    languages: z.array(z.string()).optional(),
    salaryExpectation: SalaryExpectationUpdateSchema.optional(),
    openToWork: z.boolean().optional(),
    firstName: z.string().min(1, "First name is required").optional(),
    middleName: z.string().optional(),
    preferredName: z.string().optional(),
    lastName: z.string().min(1, "Last name is required").optional(),
    gender: z.enum(["Male", "Female", "Other"]).optional(),
    maritalStatus: z.enum(["Single", "Married", "Divorced", "Widowed"]).optional(),
    citizenship: z.string().optional(),
    dateOfBirth: z.preprocess(
      (arg) => (arg ? new Date(arg as string) : undefined),
      z.date().max(new Date(), "Date of birth cannot be in the future").optional()
    ),
    age: z.number().optional(),
    previousEmployment: z.enum(["Yes", "No"]).optional(),
    streetAddress: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    zipCode: z.string().optional(),
    landLine: z.string().optional(),
    yearsOfExperience: z.string().optional(),
    
    // Recruiter fields (all optional)
    companyName: z.string().min(1, "Company name is required").optional(),
    companyWebsite: z.string().optional(),
    companyDescription: z.string().optional(),
    companyLogo: z.string().optional(),
    companyEmail: z.string().optional(),
    linkedinProfile: z.string().optional(),
    twitterProfile: z.string().optional(),
    facebookProfile: z.string().optional(),
    instagramProfile: z.string().optional(),
  }).strict(), 
  query: z.object({}).optional(), 
  params: z.object({}).optional(), 
  cookies: z.object({}).optional(), 
}).strict();

export const UserValidations={
  userSignupSchema,
  userLoginSchema,
  userUpdateSchema,
  UniversalProfileUpdateSchema
}















