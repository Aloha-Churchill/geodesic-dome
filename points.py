# define a point on a 3D plane with x, y, z coordinates, and a color, and spherical coordinates
from dataclasses import dataclass
import math
from typing import Any

import pygame
from pygame import locals
from OpenGL.GL import *
from OpenGL.GLU import *

import numpy as np


# Constants
GOLDEN_RATIO = (1 + math.sqrt(5)) / 2


@dataclass
class Point:
    x: float
    y: float
    z: float
    color: str = "red"
    r: float = 0
    theta: float = 0
    phi: float = 0


    def __init__(self, x, y, z, color="black"):
        self.x = x
        self.y = y
        self.z = z
        self.color = color
        self.r = math.sqrt(x**2 + y**2 + z**2)
        self.theta = math.atan2(math.sqrt(x**2 + y**2), z)
        self.phi = math.atan2(y, x)

    def get_tuple(self):
        return (self.x, self.y, self.z)
    
    def __repr__(self) -> str:
        # return f"({self.r}, {self.theta}, {self.phi})"
        return f"({self.x}, {self.y}, {self.z})"
    
@dataclass
class Triangle:
    left: (float, float, float)
    right: (float, float, float)
    top: (float, float, float)

class Icosahedron:
    """A class that creates an Icosahedron"""
    def __init__(self):
        self.points: list[Point] = []
        self.point_levels = []
        self.triangle_vertices = []
    
    def create_points(self, radius):
        rect_height  = GOLDEN_RATIO*(radius/math.sqrt(15 + 6*math.sqrt(5)))
        z_levels = [0, (1-rect_height)/2, (1+rect_height)/2, 1]
        L0 = [Point(0, 0, z_levels[0])]
        L1 = [Point(math.cos(math.pi/5 + 2*math.pi*i/5), math.sin(math.pi/5 + 2*math.pi*i/5), z_levels[1]) for i in range(5)] # this one must be shifted a bit
        L2 = [Point(math.cos(2*math.pi*i/5), math.sin(2*math.pi*i/5), z_levels[2]) for i in range(5)]
        L3 = [Point(0, 0, z_levels[3])]
        self.points = L0 + L1 + L2 + L3
        self.point_levels = [L0, L1, L2, L3]

    def create_triangles(self):
        t1: Triangle = Triangle(self.point_levels[1][0].get_tuple(), self.point_levels[1][1].get_tuple(), self.point_levels[0][0].get_tuple())
        t2: Triangle = Triangle(self.point_levels[1][1].get_tuple(), self.point_levels[1][2].get_tuple(), self.point_levels[0][0].get_tuple())
        t3: Triangle = Triangle(self.point_levels[1][2].get_tuple(), self.point_levels[1][3].get_tuple(), self.point_levels[0][0].get_tuple())
        t4: Triangle = Triangle(self.point_levels[1][3].get_tuple(), self.point_levels[1][4].get_tuple(), self.point_levels[0][0].get_tuple())
        t5: Triangle = Triangle(self.point_levels[1][4].get_tuple(), self.point_levels[1][0].get_tuple(), self.point_levels[0][0].get_tuple())

        t6: Triangle = Triangle(self.point_levels[1][0].get_tuple(), self.point_levels[1][1].get_tuple(), self.point_levels[2][0].get_tuple())
        t7: Triangle = Triangle(self.point_levels[1][1].get_tuple(), self.point_levels[1][2].get_tuple(), self.point_levels[2][1].get_tuple())
        t8: Triangle = Triangle(self.point_levels[1][2].get_tuple(), self.point_levels[1][3].get_tuple(), self.point_levels[2][2].get_tuple())
        t9: Triangle = Triangle(self.point_levels[1][3].get_tuple(), self.point_levels[1][4].get_tuple(), self.point_levels[2][3].get_tuple())
        t10: Triangle = Triangle(self.point_levels[1][4].get_tuple(), self.point_levels[1][0].get_tuple(), self.point_levels[2][4].get_tuple())

        t11: Triangle = Triangle(self.point_levels[2][0].get_tuple(), self.point_levels[2][1].get_tuple(), self.point_levels[1][0].get_tuple())
        t12: Triangle = Triangle(self.point_levels[2][1].get_tuple(), self.point_levels[2][2].get_tuple(), self.point_levels[1][1].get_tuple())
        t13: Triangle = Triangle(self.point_levels[2][2].get_tuple(), self.point_levels[2][3].get_tuple(), self.point_levels[1][2].get_tuple())
        t14: Triangle = Triangle(self.point_levels[2][3].get_tuple(), self.point_levels[2][4].get_tuple(), self.point_levels[1][3].get_tuple())
        t15: Triangle = Triangle(self.point_levels[2][4].get_tuple(), self.point_levels[2][0].get_tuple(), self.point_levels[1][4].get_tuple())

        t16: Triangle = Triangle(self.point_levels[2][0].get_tuple(), self.point_levels[2][1].get_tuple(), self.point_levels[3][0].get_tuple())
        t17: Triangle = Triangle(self.point_levels[2][1].get_tuple(), self.point_levels[2][2].get_tuple(), self.point_levels[3][0].get_tuple())
        t18: Triangle = Triangle(self.point_levels[2][2].get_tuple(), self.point_levels[2][3].get_tuple(), self.point_levels[3][0].get_tuple())
        t19: Triangle = Triangle(self.point_levels[2][3].get_tuple(), self.point_levels[2][4].get_tuple(), self.point_levels[3][0].get_tuple())
        t20: Triangle = Triangle(self.point_levels[2][4].get_tuple(), self.point_levels[2][0].get_tuple(), self.point_levels[3][0].get_tuple())

        # append all triangles to self.triangle vertices
        self.triangle_vertices = [t1, t2, t3, t4, t5, t6, t7, t8, t9, t10, t11, t12, t13, t14, t15, t16, t17, t18, t19, t20]
    
    def draw_triangles(self):
        glBegin(GL_TRIANGLES)
        for triangle in self.triangle_vertices:
            glVertex3fv(triangle.left)
            glVertex3fv(triangle.right)
            glVertex3fv(triangle.top)
        glEnd()        
        
        # draw edges
        glColor3f(0,0,0)
        for triangle in self.triangle_vertices:
        
            glBegin(GL_LINE_LOOP)
            glVertex3fv(triangle.left)
            glVertex3fv(triangle.right)
            glVertex3fv(triangle.top)
            glEnd()

    def draw(self, face_color="black", edge_color="black"):
        glPointSize(5.0)
        glBegin(GL_POINTS)
        for point in self.points:
            # glColor3fv(pygame.Color(point.color))
            glVertex3fv((point.x, point.y, point.z))
        glEnd()


# eventually want this to inherit from icosahedron
class Geodesic:        
    """A class that creates an geodesic dome"""
    
    def __init__(self, radius, v_num):
        self.triangle_vertices = []
        self.v_num = v_num
        self.radius = radius
        self.num_levels = 4*(v_num+1) - v_num
        self.points_levels = np.empty(self.num_levels, dtype=object)

    def create_points(self):

        def find_z_levels(self):
            """Returns an array of z height on each level"""
            return np.linspace(-self.radius, self.radius, self.num_levels)
    
        def find_r_levels(self):
            """Returns an array of radius on each level"""
            increasing = np.linspace(0, self.radius, math.ceil(self.num_levels/2))
            decreasing = increasing[::-1] if self.num_levels % 2 == 0 else increasing[::-1][1:]
            return np.concatenate((increasing, decreasing))

        def find_N_levels(self):
            """Returns an array of number of points on each level"""
            increasing = np.arange(0, self.num_levels/2, 1)*5
            decreasing = increasing[::-1] if self.num_levels % 2 == 0 else increasing[::-1][1:]
            final = np.concatenate((increasing, decreasing)).astype(int)
            final[0] = 1
            final[-1] = 1
            return final
        
        def find_s_levels(self):
            """Returns an array of shift value on each level"""
            pass

        z_levels = find_z_levels(self)
        r_levels = find_r_levels(self)
        N_levels = find_N_levels(self)
        print(f"z_levels: {z_levels}")
        print(f"r_levels: {r_levels}")
        print(f"N_levels: {N_levels}")
        assert len(z_levels) == len(r_levels) == len(N_levels) == self.num_levels


        for level_num, num_pts_in_level in enumerate(N_levels):
            self.points_levels[level_num] = np.empty(num_pts_in_level, dtype = Point)
            for point_num in range(num_pts_in_level):
                level_shift = 0
                p = Point(r_levels[level_num]*math.cos(level_shift + 2*math.pi*point_num/num_pts_in_level), r_levels[level_num]*math.sin(level_shift + 2*math.pi*point_num/num_pts_in_level), z_levels[level_num])
                self.points_levels[level_num][point_num] = p

        print("********* Points *********")
        print(*self.points_levels, sep="\n")

    def find_triangles(self):
        """Returns an array of triangles"""
        pass



g = Geodesic(radius=1,v_num=1)
g.create_points()

        




# if __name__ == "__main__":
#     ico = Icosahedron()
#     ico.create_points(1)
#     ico.create_triangles()
#     # print points each on newline using delimiter
#     print(*ico.points, sep="\n")

#     pygame.init()
#     display = (800, 600)
#     pygame.display.set_mode(display, pygame.DOUBLEBUF|pygame.OPENGL)
#     gluPerspective(45, (display[0]/display[1]), 0.1, 50.0)
#     glTranslatef(0.0, 0.0, -5)  # Adjusted viewing position

#     x_angle = 0
#     y_angle = 0
#     z_angle = 0

#     while True:
#         for event in pygame.event.get():
#             if event.type == pygame.QUIT:
#                 pygame.quit()
#                 quit()
#             elif event.type == pygame.KEYDOWN:
#                 if event.key == pygame.K_UP:
#                     x_angle -= 1
#                 elif event.key == pygame.K_DOWN:
#                     x_angle += 1
#                 elif event.key == pygame.K_LEFT:
#                     y_angle -= 1
#                 elif event.key == pygame.K_RIGHT:
#                     y_angle += 1
#                 elif event.key == pygame.K_a:
#                     z_angle -= 1
#                 elif event.key == pygame.K_d:
#                     z_angle += 1

#         glClear(GL_COLOR_BUFFER_BIT|GL_DEPTH_BUFFER_BIT)
#         glLoadIdentity()  # Reset transformations
#         gluPerspective(45, (display[0]/display[1]), 0.1, 50.0)
#         glRotatef(x_angle, 1, 0, 0)
#         glRotatef(y_angle, 0, 1, 0)
#         glRotatef(z_angle, 0, 0, 1)
#         glTranslatef(0.0, 0.0, -5)
#         ico.draw()
#         pygame.display.flip()
#         pygame.time.wait(10)


