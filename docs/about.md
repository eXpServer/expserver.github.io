<script setup>
import { VPTeamMembers } from 'vitepress/theme'

const members = [
  {
    avatar: 'https://www.github.com/emanuelchristo.png',
    name: 'Emanuel Christo',
    title: 'Developer',
    links: [
      { icon: 'github', link: 'https://github.com/emanuelchristo' },
      { icon: 'linkedin', link: 'https://ecris.in/' }
    ]
  }, {
    avatar: 'https://www.github.com/aadhavanpl.png',
    name: 'Aadhavan PL',
    title: 'Developer',
    links: [
      { icon: 'github', link: 'https://github.com/aadhavanpl' },
      { icon: 'linkedin', link: 'https://aadhii.in/' }
    ]
  },
]
</script>

# About

## Overview

eXpServer is an educational web server built entirely in C language, designed to aid students in understanding the inner workings of web servers through the implementation of one from scratch using Linux socket programming APIs.

The project is structured to be offered as an undergraduate Networks Lab course for Computer Science and Engineering courses in colleges. Through a carefully crafted ‘Roadmap’, students are systematically guided through various stages, each addressing specific objectives. This incremental learning approach helps students keep track of where they are in terms of course progression while also enabling instructors to assess their development against predefined milestones.

In the early stages of the roadmap, much of the code is directly provided to the student. However, as the stages progress most of the code is to be written by the students themselves with the documentation outlining the requirements that the functions and modules should meet. The intention behind this approach is to gently ease the learning curve, thereby facilitating the student's initial engagement with the project. As they progress, the aim is to foster independent critical thinking, encouraging students to devise their own solutions rather than relying solely on the documentation to guide them.

Having an understanding of basic networking concepts such as, client server model, TCP/IP protocol stack, OSI model etc. is a good starting point. Most of the concepts associated with building eXpServer are explained in enough detail through guides available in the documentation. These guides are linked from appropriate parts of the roadmap to explain the concept related to the stage the student is currently in. Links to external resources that further explain the concepts are also included for extended reading.

Upon completing the project, we will have crafted a fully functional web server compatible with various Linux distributions. eXpServer will possess a range of capabilities, including serving static files, reverse proxying requests, load balancing, performing gzip compression, implementing caching mechanisms, rate limiting requests, supporting TLS encryption and so on. Notably, the server will maintain high performance standards, efficiently handling numerous requests by utilising multiple CPU cores.

This project provides students with practical experience in understanding the architecture of modern web servers tasked with managing immense internet traffic. Through hands-on engagement with eXpServer development, students gain insight into the complexities of efficiently handling dynamic web traffic, preparing them for real-world challenges faced in the industry.

## Authors

<VPTeamMembers size="small" :members="members" />

Developed under the guidance of [Dr. Vinod Pathari](https://nitc.ac.in/department/computer-science-amp-engineering/faculty-and-staff/faculty/f6ebabe0-ef35-4efd-964a-59325844b7c5) and [Dr. Murali Krishnan K](https://nitc.ac.in/department/computer-science-amp-engineering/faculty-and-staff/faculty/bdb94a31-f29a-4fb0-b4d5-7db9be64edef) of National Institute of Technology Calicut.

## License

<img src="/assets/common/ccbync.png" width="150">

eXpServer is licensed under a [Creative Commons Attribution-NonCommercial 4.0 International License](https://creativecommons.org/licenses/by-nc/4.0/). Based on the work at https://github.com/eXpServer

## Acknowledgement

We thank GitHub for providing the free for use platform on which this tutoring system has been hosted. We also thank all individuals who have supported the work in one form or the other.
