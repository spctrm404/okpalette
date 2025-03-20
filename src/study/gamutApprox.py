mat_rgb_to_lms = [
 [ 0.41222146947076294, 0.5363325372617349, 0.051445993267502196 ],
 [ 0.21190349581782517, 0.6806995506452345, 0.10739695353694056  ],
 [ 0.08830245919005639, 0.2817188391361215, 0.6299787016738223   ]
]

mat_lms_to_oklab = [
 [ 0.2104542683093140,  0.7936177747023054, -0.0040720430116193 ],
 [ 1.9779985324311684, -2.4285922420485799,  0.4505937096174110 ],
 [ 0.0259040424655478,  0.7827717124575296, -0.8086757549230774 ]
]

mat_oklab_to_lms = [
 [ 1.0000000000000000,  0.3963377773761749,  0.2158037573099136 ],
 [ 1.0000000000000000, -0.1055613458156586, -0.0638541728258133 ],
 [ 1.0000000000000000, -0.0894841775298119, -1.2914855480194092 ]
]

mat_lms_to_rgb = [
 [  4.07674163607596    , -3.307711539258063 ,  0.23096990318210486 ],
 [ -1.2684379732850315  ,  2.609757349287688 , -0.34131937600265727 ],
 [ -0.004196076138675495, -0.7034186179359363,  1.7076146940746117  ]
]

def linear_srgb_to_oklab(c):
 l = mat_rgb_to_lms[0][0]*c[0,...] + mat_rgb_to_lms[0][1]*c[1,...] + mat_rgb_to_lms[0][2]*c[2,...]
 m = mat_rgb_to_lms[1][0]*c[0,...] + mat_rgb_to_lms[1][1]*c[1,...] + mat_rgb_to_lms[1][2]*c[2,...]
 s = mat_rgb_to_lms[2][0]*c[0,...] + mat_rgb_to_lms[2][1]*c[1,...] + mat_rgb_to_lms[2][2]*c[2,...]

 l_ = np.cbrt(l)
 m_ = np.cbrt(m)
 s_ = np.cbrt(s)

 return np.array([
  mat_lms_to_oklab[0][0]*l_ + mat_lms_to_oklab[0][1]*m_ + mat_lms_to_oklab[0][2]*s_,
  mat_lms_to_oklab[1][0]*l_ + mat_lms_to_oklab[1][1]*m_ + mat_lms_to_oklab[1][2]*s_,
  mat_lms_to_oklab[2][0]*l_ + mat_lms_to_oklab[2][1]*m_ + mat_lms_to_oklab[2][2]*s_,
 ])

# define functions for R, G and B as functions of S,h (with L = 1 and S = C/L)

def to_lms(S,h):
 a = S*np.cos(h)
 b = S*np.sin(h)

 l_ = mat_oklab_to_lms[0][0] + mat_oklab_to_lms[0][1]*a + mat_oklab_to_lms[0][2]*b
 m_ = mat_oklab_to_lms[1][0] + mat_oklab_to_lms[1][1]*a + mat_oklab_to_lms[1][2]*b
 s_ = mat_oklab_to_lms[2][0] + mat_oklab_to_lms[2][1]*a + mat_oklab_to_lms[2][2]*b

 l = l_*l_*l_
 m = m_*m_*m_
 s = s_*s_*s_

 return (l,m,s)

def to_lms_dS(S,h):
 a = S*np.cos(h)
 b = S*np.sin(h)

 l_ = mat_oklab_to_lms[0][0] + mat_oklab_to_lms[0][1]*a + mat_oklab_to_lms[0][2]*b
 m_ = mat_oklab_to_lms[1][0] + mat_oklab_to_lms[1][1]*a + mat_oklab_to_lms[1][2]*b
 s_ = mat_oklab_to_lms[2][0] + mat_oklab_to_lms[2][1]*a + mat_oklab_to_lms[2][2]*b

 l = (mat_oklab_to_lms[0][1]*np.cos(h) + mat_oklab_to_lms[0][2]*np.sin(h))*3*l_*l_
 m = (mat_oklab_to_lms[1][1]*np.cos(h) + mat_oklab_to_lms[1][2]*np.sin(h))*3*m_*m_
 s = (mat_oklab_to_lms[2][1]*np.cos(h) + mat_oklab_to_lms[2][2]*np.sin(h))*3*s_*s_

 return (l,m,s)

def to_lms_dS2(S,h):
 a = S*np.cos(h)
 b = S*np.sin(h)

 l_ = mat_oklab_to_lms[0][0] + mat_oklab_to_lms[0][1]*a + mat_oklab_to_lms[0][2]*b
 m_ = mat_oklab_to_lms[1][0] + mat_oklab_to_lms[1][1]*a + mat_oklab_to_lms[1][2]*b
 s_ = mat_oklab_to_lms[2][0] + mat_oklab_to_lms[2][1]*a + mat_oklab_to_lms[2][2]*b

 l = (mat_oklab_to_lms[0][1]*np.cos(h) + mat_oklab_to_lms[0][2]*np.sin(h))**2*6*l_
 m = (mat_oklab_to_lms[1][1]*np.cos(h) + mat_oklab_to_lms[1][2]*np.sin(h))**2*6*m_
 s = (mat_oklab_to_lms[2][1]*np.cos(h) + mat_oklab_to_lms[2][2]*np.sin(h))**2*6*s_

 return (l,m,s)


def to_R(S,h):
 (l,m,s) = to_lms(S,h)
 return mat_lms_to_rgb[0][0]*l + mat_lms_to_rgb[0][1]*m + mat_lms_to_rgb[0][2]*s

def to_R_dS(S,h):
 (l,m,s) = to_lms_dS(S,h)
 return mat_lms_to_rgb[0][0]*l + mat_lms_to_rgb[0][1]*m + mat_lms_to_rgb[0][2]*s

def to_R_dS2(S,h):
 (l,m,s) = to_lms_dS2(S,h)
 return mat_lms_to_rgb[0][0]*l + mat_lms_to_rgb[0][1]*m + mat_lms_to_rgb[0][2]*s

def to_G(S,h):
 (l,m,s) = to_lms(S,h)
 return mat_lms_to_rgb[1][0]*l + mat_lms_to_rgb[1][1]*m + mat_lms_to_rgb[1][2]*s

def to_G_dS(S,h):
 (l,m,s) = to_lms_dS(S,h)
 return mat_lms_to_rgb[1][0]*l + mat_lms_to_rgb[1][1]*m + mat_lms_to_rgb[1][2]*s

def to_G_dS2(S,h):
 (l,m,s) = to_lms_dS2(S,h)
 return mat_lms_to_rgb[1][0]*l + mat_lms_to_rgb[1][1]*m + mat_lms_to_rgb[1][2]*s

def to_B(S,h):
 (l,m,s) = to_lms(S,h)
 return mat_lms_to_rgb[2][0]*l + mat_lms_to_rgb[2][1]*m + mat_lms_to_rgb[2][2]*s

def to_B_dS(S,h):
 (l,m,s) = to_lms_dS(S,h)
 return mat_lms_to_rgb[2][0]*l + mat_lms_to_rgb[2][1]*m + mat_lms_to_rgb[2][2]*s

def to_B_dS2(S,h):
 (l,m,s) = to_lms_dS2(S,h)
 return mat_lms_to_rgb[2][0]*l + mat_lms_to_rgb[2][1]*m + mat_lms_to_rgb[2][2]*s
