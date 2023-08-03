# given the vertices of a base triangle and a new triangle, find the rotation matrix to transform the base triangle to the new triangle

import numpy as np
import math

# calculate 3d transformation matrix
def transform_triangles(base_triangle, new_triangle):
    # base_triangle: 3x3 numpy array of the vertices of the base triangle
    # new_triangle: 3x3 numpy array of the vertices of the new triangle
    # return: 3x3 numpy array of the rotation matrix to transform the base triangle to the new triangle

    # calculate the centroid of each triangle
    base_centroid = np.mean(base_triangle, axis=0)
    new_centroid = np.mean(new_triangle, axis=0)

    # calculate the covariance matrix
    covariance_matrix = np.dot(np.transpose(base_triangle - base_centroid), (new_triangle - new_centroid))

    # calculate the SVD of the covariance matrix
    U, S, V = np.linalg.svd(covariance_matrix)

    # calculate the rotation matrix
    rotation_matrix = np.dot(U, np.transpose(V))

    return rotation_matrix

# create triangles to test the function
base_triangle = np.array([[0, 0, 0], [1, 0, 0], [0, 1, 0]])
new_triangle = np.array([[0, 0, 0], [0, 1, 0], [0, 0, 1]])

# calculate the rotation matrix
rotation_matrix = transform_triangles(base_triangle, new_triangle)

# print the rotation matrix
print(rotation_matrix)

# calculate the new triangle
new_triangle_transformed = np.dot(base_triangle, rotation_matrix)

# print the new triangle and ensure it is the same as the new triangle
print(new_triangle_transformed)
print(new_triangle)

    






