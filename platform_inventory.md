## Platform Backend

### platform/backend/package.json
- **Purpose:** Package definition
- **Dependencies:** mongoose, jsonwebtoken, bcrypt, bcryptjs, nodemailer, express, helmet, cors, dotenv, express-rate-limit, express-validator, multer, resend, razorpay

### platform/backend/src/configs/db.js
- **Purpose:** Provides logic/components for db
- **Imports:** mongoose
- **Exports:** connectDB

### platform/backend/src/configs/multer.js
- **Purpose:** Provides logic/components for multer
- **Imports:** multer
- **Exports:** upload

### platform/backend/src/middlewares/authMiddleware.js
- **Purpose:** Provides logic/components for authMiddleware
- **Imports:** jwt, logger, ApiError, User
- **Exports:** protect

### platform/backend/src/models/User.js
- **Purpose:** Provides logic/components for User
- **Imports:** mongoose, bcrypt
- **Exports:** User

### platform/backend/src/models/OTP.js
- **Purpose:** Provides logic/components for OTP
- **Imports:** mongoose
- **Exports:** OTP

### platform/backend/src/models/PasswordResetToken.js
- **Purpose:** Provides logic/components for PasswordResetToken
- **Imports:** mongoose, crypto
- **Exports:** PasswordResetToken

### platform/backend/src/models/Payment.js
- **Purpose:** Provides logic/components for Payment
- **Imports:** mongoose, plans
- **Exports:** Payment

### platform/backend/src/models/Subscription.js
- **Purpose:** Provides logic/components for Subscription
- **Imports:** mongoose, plans
- **Exports:** Subscription

### platform/backend/src/repositories/userRepository.js
- **Purpose:** Provides logic/components for userRepository
- **Imports:** User
- **Exports:** userRepository

### platform/backend/src/repositories/paymentRepository.js
- **Purpose:** Provides logic/components for paymentRepository
- **Imports:** Payment
- **Exports:** paymentRepository

### platform/backend/src/repositories/subscriptionRepository.js
- **Purpose:** Provides logic/components for subscriptionRepository
- **Imports:** Subscription
- **Exports:** subscriptionRepository

### platform/backend/src/services/billingService.js
- **Purpose:** Provides logic/components for billingService
- **Imports:** plans, subscriptionRepository, paymentRepository
- **Exports:** billingService

### platform/backend/src/services/otpService.js
- **Purpose:** Provides logic/components for otpService
- **Imports:** crypto, OTP, ApiError
- **Exports:** otpService

### platform/backend/src/services/paymentService.js
- **Purpose:** Provides logic/components for paymentService
- **Imports:** crypto, razorpay, plans, paymentRepository, subscriptionRepository...
- **Exports:** paymentService

## Platform Frontend

### platform/frontend/package.json
- **Purpose:** Package definition
- **Dependencies:** axios, lucide-react, react, react-dom, react-hot-toast, react-router-dom, @reduxjs/toolkit, react-redux, @curatocv/api-client, @curatocv/shared-utils

### platform/frontend/src/app/features/authSlice.js
- **Purpose:** Provides logic/components for authSlice
- **Imports:** { createSlice }
- **Exports:** TOKEN_STORAGE_KEY, authSlice.reducer

### platform/frontend/src/configs/api.js
- **Purpose:** Provides logic/components for api
- **Imports:** axios
- **Exports:** api

### platform/frontend/src/configs/products.js
- **Purpose:** Provides logic/components for products
- **Imports:** None
- **Exports:** PRODUCTS

### platform/frontend/src/pages/Billing.jsx
- **Purpose:** Provides logic/components for Billing
- **Imports:** { useState, useEffect }, { useNavigate }, { ArrowLeft }, billingService, api...
- **Exports:** Billing

### platform/frontend/src/pages/Checkout.jsx
- **Purpose:** Provides logic/components for Checkout
- **Imports:** { useState, useEffect, useRef }, { useSearchParams, useNavigate }, { ArrowLeft }, billingService, { loadScript }
- **Exports:** Checkout

### platform/frontend/src/pages/ForgotPassword.jsx
- **Purpose:** Provides logic/components for ForgotPassword
- **Imports:** React, { useState, useEffect }, { Link, useNavigate }, { toast }, emailService, AuthPageLayout...
- **Exports:** ForgotPassword

### platform/frontend/src/pages/Home.jsx
- **Purpose:** Provides logic/components for Home
- **Imports:** React, Banner, Hero, Features, Testimonial...
- **Exports:** Home

### platform/frontend/src/pages/Layout.jsx
- **Purpose:** Provides logic/components for Layout
- **Imports:** { Outlet, Link }, Navbar, { useSelector }, Loader, Login...
- **Exports:** Layout

### platform/frontend/src/pages/Login.jsx
- **Purpose:** Provides logic/components for Login
- **Imports:** { Lock, Mail, User2Icon, Check, X, Eye, EyeOff }, React, { useState }, { useDispatch }, { useNavigate }, { login }...
- **Exports:** Login

### platform/frontend/src/pages/NotFound.jsx
- **Purpose:** Provides logic/components for NotFound
- **Imports:** { Link }
- **Exports:** NotFound

### platform/frontend/src/pages/Pricing.jsx
- **Purpose:** Provides logic/components for Pricing
- **Imports:** { useState, useEffect }, { useNavigate }, { ArrowLeft }, billingService, BillingPeriodSelector...
- **Exports:** Pricing

### platform/frontend/src/pages/Products.jsx
- **Purpose:** Provides logic/components for Products
- **Imports:** React, { useState }, { ProductGrid }, { useSelector, useDispatch }, { logout }, { useNavigate, Link }...
- **Exports:** Products

### platform/frontend/src/pages/Profile.jsx
- **Purpose:** Provides logic/components for Profile
- **Imports:** React, { useState, useEffect, useCallback, useRef }, { useDispatch, useSelector }, { useNavigate }, {, toast...
- **Exports:** Profile

### platform/frontend/src/pages/ResetPassword.jsx
- **Purpose:** Provides logic/components for ResetPassword
- **Imports:** React, { useState, useEffect }, { useNavigate }, { toast }, { Check, X, Eye, EyeOff }, emailService...
- **Exports:** ResetPassword

### platform/frontend/src/pages/VerifyEmail.jsx
- **Purpose:** Provides logic/components for VerifyEmail
- **Imports:** React, { useState, useEffect }, { useSelector, useDispatch }, { useNavigate }, { toast }, { login }...
- **Exports:** VerifyEmail

### platform/frontend/src/components/auth/AuthPageLayout.jsx
- **Purpose:** Provides logic/components for AuthPageLayout
- **Imports:** BrandLockup
- **Exports:** AuthPageLayout

### platform/frontend/src/components/auth/OtpInput.jsx
- **Purpose:** Provides logic/components for OtpInput
- **Imports:** React, { useRef, useEffect, useState }
- **Exports:** OtpInput

### platform/frontend/src/components/billing/BillingPeriodSelector.jsx
- **Purpose:** Provides logic/components for BillingPeriodSelector
- **Imports:** React
- **Exports:** BillingPeriodSelector

### platform/frontend/src/components/billing/PaymentStatus.jsx
- **Purpose:** Provides logic/components for PaymentStatus
- **Imports:** React
- **Exports:** PaymentStatus

### platform/frontend/src/components/billing/PlanCard.jsx
- **Purpose:** Provides logic/components for PlanCard
- **Imports:** React, { ArrowRight }
- **Exports:** PlanCard

### platform/frontend/src/components/billing/SubscriptionCard.jsx
- **Purpose:** Provides logic/components for SubscriptionCard
- **Imports:** None
- **Exports:** None

### platform/frontend/src/components/billing/UpgradeModal.jsx
- **Purpose:** Provides logic/components for UpgradeModal
- **Imports:** React, { XIcon, CheckCircle2Icon }, { useNavigate }
- **Exports:** UpgradeModal

### platform/frontend/src/components/billing/UsageMeter.jsx
- **Purpose:** Provides logic/components for UsageMeter
- **Imports:** None
- **Exports:** UsageMeter

### platform/frontend/src/components/common/AccountMenu.jsx
- **Purpose:** Provides logic/components for AccountMenu
- **Imports:** { useEffect, useRef, useState }, { useDispatch, useSelector }, { Link, useNavigate }, { ChevronDown, LogOut, Settings, UserRound }, { logout }
- **Exports:** AccountMenu

### platform/frontend/src/components/common/BrandLockup.jsx
- **Purpose:** Provides logic/components for BrandLockup
- **Imports:** { Link }
- **Exports:** BrandLockup

### platform/frontend/src/components/common/Breadcrumbs.jsx
- **Purpose:** Provides logic/components for Breadcrumbs
- **Imports:** React, { Link, useLocation }, { ChevronRight }
- **Exports:** Breadcrumbs

### platform/frontend/src/components/common/Button.jsx
- **Purpose:** Provides logic/components for Button
- **Imports:** None
- **Exports:** Button

### platform/frontend/src/components/common/Loader.jsx
- **Purpose:** Provides logic/components for Loader
- **Imports:** React
- **Exports:** Loader

### platform/frontend/src/components/common/Navbar.jsx
- **Purpose:** Provides logic/components for Navbar
- **Imports:** { useState }, { useSelector }, { Link }, { ArrowLeft }, BrandLockup
- **Exports:** Navbar

### platform/frontend/src/components/home/Banner.jsx
- **Purpose:** Provides logic/components for Banner
- **Imports:** { Sparkles, ArrowRight }, { useNavigate }
- **Exports:** Banner

### platform/frontend/src/components/home/CallToAction.jsx
- **Purpose:** Provides logic/components for CallToAction
- **Imports:** React
- **Exports:** CallToAction

### platform/frontend/src/components/home/Features.jsx
- **Purpose:** Provides logic/components for Features
- **Imports:** React, { Zap }, Title
- **Exports:** Features

### platform/frontend/src/components/home/Footer.jsx
- **Purpose:** Provides logic/components for Footer
- **Imports:** React, BrandLockup
- **Exports:** Footer

### platform/frontend/src/components/home/Hero.jsx
- **Purpose:** Provides logic/components for Hero
- **Imports:** React, { useSelector }, { Link }, BrandLockup
- **Exports:** Hero

### platform/frontend/src/components/home/Testimonial.jsx
- **Purpose:** Provides logic/components for Testimonial
- **Imports:** React, Title, {
- **Exports:** Testimonial

### platform/frontend/src/components/home/Title.jsx
- **Purpose:** Provides logic/components for Title
- **Imports:** React
- **Exports:** Title

### platform/frontend/src/components/products/ProductCard.jsx
- **Purpose:** Provides logic/components for ProductCard
- **Imports:** React, { ArrowRight, CheckCircle2, FileText, NotebookPen }, { useNavigate }, { ResumePreview, NotesPreview }
- **Exports:** ProductCard

### platform/frontend/src/components/products/ProductGrid.jsx
- **Purpose:** Provides logic/components for ProductGrid
- **Imports:** React, { PRODUCTS }, { ProductCard }
- **Exports:** ProductGrid

### platform/frontend/src/components/products/ProductPreviews.jsx
- **Purpose:** Provides logic/components for ProductPreviews
- **Imports:** React, { FileText, NotebookPen }
- **Exports:** ResumePreview, NotesPreview

