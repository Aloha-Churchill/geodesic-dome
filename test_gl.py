import sys
from OpenGL.GL import *
from OpenGL.GLUT import *
from OpenGL.GLU import *

window = 0
width, height = 500, 500

def draw_point():
    glClearColor(1.0, 1.0, 1.0, 1.0)  # Set the background color to white
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT)
    glLoadIdentity()
    glTranslatef(0.0,0.0,-5)

    glPointSize(20.0)  # Set the point size to 20 pixels

    glBegin(GL_POINTS)
    glVertex3f(0.0, 0.0, 0.0) 
    glEnd()

    glutSwapBuffers()


def draw_sphere():
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT)
    glLoadIdentity()

    # Move the sphere away from the camera
    glTranslatef(0.0, 0.0, -5.0)

    glColor3f(1.0, 0.0, 0.0)  # Set the sphere color to red

    # Draw the sphere
    glutSolidSphere(1.0, 50, 50)  # Parameters are: radius, slices, stacks

    glutSwapBuffers()

def main():
    global window
    glutInit(sys.argv)
    glutInitDisplayMode(GLUT_RGBA | GLUT_DOUBLE | GLUT_ALPHA | GLUT_DEPTH)
    glutInitWindowSize(width, height)
    glutInitWindowPosition(0, 0)
    window = glutCreateWindow("OpenGL Point") 
    glEnable(GL_DEPTH_TEST)
    glutDisplayFunc(draw_sphere)
    glutIdleFunc(draw_sphere)
    glEnable(GL_DEPTH_TEST)
    glutMainLoop()

if __name__ == "__main__":
    main()
