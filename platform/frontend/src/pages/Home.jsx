/**
 * Developer context for platform/frontend/src/pages/Home.jsx.
 * Purpose: implement the Platform Home page workflow.
 * Why here: account, navigation, and billing surfaces are common platform capabilities mounted by the root shell.
 */
import React from 'react'
import Banner from '../components/home/Banner'
import Hero from '../components/home/Hero'
import Features from '../components/home/Features'
import Testimonial from '../components/home/Testimonial'
import CallToAction from '../components/home/CallToAction'
import Footer from '../components/home/Footer'

const Home = () => {
    return (
        <div>
            <Banner />
            <Hero />
            <Features />
            <Testimonial />
            <CallToAction />
            <Footer />
        </div>
    )
}

export default Home