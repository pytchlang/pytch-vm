def increment_every_elt_with_while(xs):
    i = 0
    while i != len(xs):
        xs[i] += 1
        i += 1

def increment_every_elt_with_for(xs):
    for i in range(len(xs)):
        xs[i] += 1
