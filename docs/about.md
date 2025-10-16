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
  }, {
    avatar: 'https://avatars.githubusercontent.com/u/122230731?v=4',
    name: 'Mayank Gupta',
    title: 'Developer',
    links: [
      { icon: 'github', link: 'https://github.com/71203mayank' },
      { icon: 'linkedin', link: 'https://www.linkedin.com/in/mayank-gupta-715210242' }
    ]
  }, {
    avatar: 'images/about/Anuj_Haval.jpg',
    name: 'Anuj Haval',
    title: 'Developer',
    links: [
      { icon: 'github', link: 'https://github.com/AnujHaval' },
      { icon: 'linkedin', link: 'https://www.linkedin.com/in/anuj-haval-106567251/' }
    ]
  }, {
    avatar: 'https://avatars.githubusercontent.com/u/97302579?v=4',
    name: 'Binshadh Basheer',
    title: 'Developer',
    links: [
      { icon: 'github', link: 'https://github.com/binshadhbu' },
      { icon: 'linkedin', link: 'https://www.linkedin.com/in/binshadh-basheer-369476227/' }
    ]
  }, {
    avatar: 'images/about/Diljith_PD.jpg',
    name: 'Diljith P D',
    title: 'Developer',
    links: [
      { icon: 'github', link: 'https://github.com/th3bossc' },
      { icon: 'linkedin', link: 'https://www.linkedin.com/in/diljith-p-d-815716250/' }
    ]
  }, {
    avatar: 'images/about/Nandana_S_Nair.jpg',
    name: 'Nandana S Nair',
    title: 'Developer',
    links: [
      { icon: 'github', link: 'https://github.com/NandanaSNair02' },
      { icon: 'linkedin', link: 'https://www.linkedin.com/in/nandana-s-nair-949808222/' }
    ]
  }, {
    avatar: 'https://avatars.githubusercontent.com/u/134227262?v=4',
    name: 'Nikhisha T S',
    title: 'Developer',
    links: [
      { icon: 'github', link: 'https://github.com/nikhishats7' },
      { icon: 'linkedin', link: '' }
    ]
  }, {
    avatar: 'https://avatars.githubusercontent.com/u/169025635?v=4',
    name: 'Nandana D V',
    title: 'Developer',
    links: [
      { icon: 'github', link: 'https://github.com/NandanaDV' },
      { icon: 'linkedin', link: '' }
    ]
  }, {
    avatar: 'https://avatars.githubusercontent.com/u/122631489?v=4',
    name: 'Fayis Rahman',
    title: 'Developer',
    links: [
      { icon: 'github', link: 'https://github.com/FayisRahman' },
      { icon: 'linkedin', link: 'https://www.linkedin.com/in/fayis-rahman-thadathil-6644b9250/' }
    ]
  }, {
    avatar: 'https://avatars.githubusercontent.com/u/15691889?v=4',
    name: 'Sreehari J',
    title: 'Developer',
    links: [
      { icon: 'github', link: 'https://github.com/Sreeharij' },
      { icon: 'linkedin', link: 'https://www.linkedin.com/in/sreehari-j-906873308/' }
    ]
  }, {
    avatar: 'https://avatars.githubusercontent.com/u/118613998?v=4',
    name: 'Mohammed Shibin E',
    title: 'Developer',
    links: [
      { icon: 'github', link: 'https://github.com/Shibin-Ez' },
      { icon: 'linkedin', link: '' }
    ]
  }
  // add more here
]
</script>

# About

The eXpServer project is an educational web server implementation built entirely in the C language. It is designed to help individuals understand the inner workings of web servers by guiding them through the process of building one from scratch using Linux socket programming APIs.

## Intended audience

The project is structured to be offered as an undergraduate Networks Lab course for Computer Science and Engineering programs in universities and colleges. It is ideal for students pursuing a Computer Science degree, particularly those who are currently enrolled or have previously enrolled in a networking theory course.

The implementation of the project is well-suited for a single semester of a Networks laboratory course or as a programming assignment associated with an undergraduate Networks theory course.

Furthermore, individuals interested in understanding the workings of web servers and eager to implement one themselves are welcome to undertake this project.

## Prerequisites

Since eXpServer will be written entirely in C, the primary prerequisite is a familiarity with the C programming language at the level of a junior year undergraduate CS student.

Having an understanding of basic networking concepts such as, client server model, TCP/IP protocol stack etc. may be beneficial, but not necessary.

Most of the concepts associated with building eXpServer are explained in enough detail through guides available in the documentation. These guides are linked from appropriate parts of the roadmap to explain the concept related to the stage the student is currently in. Links to external resources that further explain the concepts are also included for extended reading.

## What to expect

Participants in the eXpServer project can anticipate a thorough learning journey centred on constructing an operational web server from scratch. They will gain a deep understanding of networking fundamentals, encompassing the client-server model, TCP/IP protocol stack, HTTP protocol, reverse proxying, load balancing, gzip compression etc. all through practical implementation and experimentation. Additional areas of learning encompass C programming, Linux system programming, problem-solving, critical thinking, and the software development cycle.

A structured [roadmap](/roadmap/) guides individuals through various stages, systematically addressing specific objectives. This incremental learning approach helps them keep track of where they are in terms of course progression while also enabling instructors to assess their development against predefined milestones.

Upon completing the project, the individual will have crafted a functional web server compatible with various Linux distributions.

eXpServer will incorporate a range of features, including but not limited to:

- Serving static files
- Reverse proxying
- Load balancing
- Gzip compression
- Implementing caching mechanisms
- Rate limiting & timeout for requests
- TLS support etc.

This project provides individuals with practical experience in understanding the architecture of modern web servers. Through hands-on engagement with eXpServer development, individuals gain insight into the complexities of handling dynamic web traffic, preparing them for real-world challenges faced in the industry.

## Authors

The content in the website and the documentation has been authored in the [Department of Computer Science and Engineering](https://minerva.nitc.ac.in/), [National Institute of Technology Calicut](http://nitc.ac.in/) under the guidance of [Dr. Murali Krishnan K](https://nitc.ac.in/department/computer-science-amp-engineering/faculty-and-staff/faculty/bdb94a31-f29a-4fb0-b4d5-7db9be64edef) and [Dr. Vinod Pathari](https://nitc.ac.in/department/computer-science-amp-engineering/faculty-and-staff/faculty/f6ebabe0-ef35-4efd-964a-59325844b7c5).

<VPTeamMembers size="small" :members="members" />

## License

<img src="/assets/common/ccbync.png" width="150">

eXpServer is licensed under a [Creative Commons Attribution-NonCommercial 4.0 International License](https://creativecommons.org/licenses/by-nc/4.0/). Based on the work at https://github.com/eXpServer

## Acknowledgement

We thank GitHub for providing the free for use platform on which this tutoring system has been hosted. We also thank all individuals who have supported the work in one form or the other.
