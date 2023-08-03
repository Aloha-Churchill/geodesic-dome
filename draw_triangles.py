
# use pyopengl to draw the triangles
from OpenGL.GL import *
from OpenGL.GLU import *
from OpenGL.GLUT import *

# import triangle matrices from transform_triangles.py
from transform_triangles import *


# initialize the window
glutInit()
glutInitDisplayMode(GLUT_RGBA | GLUT_DOUBLE | GLUT_DEPTH)

# create the window
glutInitWindowSize(640, 480)
glutInitWindowPosition(0, 0)
window = glutCreateWindow("OpenGL")

# initialize the view
glMatrixMode(GL_PROJECTION)
glLoadIdentity()
gluPerspective(45, 640.0 / 480.0, 0.1, 100.0)
glMatrixMode(GL_MODELVIEW)
glLoadIdentity()

# set the background color
glClearColor(0.0, 0.0, 0.0, 1.0)

# draw a point in pyopengl and display it (dont use a function)
glBegin(GL_POINTS)
glVertex3f(0.0, 0.0, -5.0)
glEnd()


# # set the rotation angle
# angle = 0

# # draw the triangles (composed of matrix of 3d points) using opengl
# # takes in 3x3 numpy array of vertices and draws the triangle
# def draw_triangle(triangle):

#     # set the color of the triangle
#     glColor3f(1.0, 1.0, 1.0)

#     # draw the triangle
#     glBegin(GL_TRIANGLES)
#     for vertex in triangle:
#         glVertex3fv(vertex)
#     glEnd()

#     # connect each vertex to the next vertex
#     glBegin(GL_LINES)
#     for vertex in triangle:
#         glVertex3fv(vertex)
#     glVertex3fv(triangle[0])
#     glEnd()


# # call the draw_triangle function to draw the triangles
# draw_triangle(base_triangle)
# draw_triangle(new_triangle)

