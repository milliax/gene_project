import numpy as np
from scipy.optimize import linear_sum_assignment
import tqdm
import datetime


class Gene:
    stores = []
    num_iteration = 5000
    num_chrome = 20
    num_bit = 9

    pc = 0.95
    pm = 0.5

    num_of_cut = 10
    num_parent = num_chrome
    num_crossover = int(pc * num_chrome / 2)
    num_crossover_2 = num_crossover * 2
    num_mutation = int(pm * num_chrome * num_bit)

    np.random.seed(0)

    def __init__(self, stores_from_db):
        self.stores = stores_from_db
        self.num_bit = len(stores_from_db)

    def initPop(self):
        pop = np.zeros((self.num_chrome, self.num_bit), dtype=int)
        for i in range(self.num_chrome):
            ones_indices = np.random.choice(self.num_bit, 7, replace=False)
            pop[i, ones_indices] = 1
        return pop

    def fitFunc(self, x):
        # Example fitness function using store attributes
        z = 0
        penalty_cnt = 0

        now = datetime.datetime.now()

        for i, gene in enumerate(x):

            if gene == 1:  # If the gene is selected
                store = self.stores[i]

                this_z = store["rating"] * 10 - \
                    store["price"] - store["distance"] / 1000

                # if store has key lastSelectedAt
                last_eaten = store.get("lastSelectedAt")

                if last_eaten is not None:
                    # Calculate the time since last eaten
                    time_since_last_eaten = now - \
                        datetime.datetime.fromisoformat(last_eaten)

                    if (time_since_last_eaten.days < 7):
                        z /= 2
                    elif (time_since_last_eaten.days < 14):
                        z /= 1.5
                    elif (time_since_last_eaten.days < 30):
                        z /= 1.2

                # Example constraints
                if store["rating"] < 3.0:  # Penalize low-rated stores
                    penalty_cnt += 1

                z += this_z

        if x.sum() != 7:  # Limit to 7 selected stores
            penalty_cnt += 1
        else:
            # calculate the possibility of the selected stores
            selected_stores = [self.stores[i]
                               for i in range(len(x)) if x[i] == 1]
            cost_matrix = []
            for store in selected_stores:
                row = []
                for day in range(7):  # Days of the week (0-6)
                    if any(oh["dayOfWeek"] == day for oh in store["openingHours"]):
                        # No cost if the store is open on this day
                        row.append(0)
                    else:
                        row.append(1e6)  # High cost if the store is not open
                cost_matrix.append(row)

            # Solve the assignment problem
            row_ind, col_ind = linear_sum_assignment(cost_matrix)

            total_cost = sum(cost_matrix[row][col]
                             for row, col in zip(row_ind, col_ind))
            if total_cost >= 1e6:  # If any store couldn't be assigned to an open day
                penalty_cnt += 1

        penalty_cost = 1e7

        return z - penalty_cost * penalty_cnt

    def evaluatePop(self, p):
        return [self.fitFunc(p[i]) for i in range(len(p))]

    def selection(self, p, p_fit):
        a = []
        for i in range(self.num_parent):
            [j, k] = np.random.choice(self.num_chrome, 2, replace=False)
            a.append(p[j] if p_fit[j] > p_fit[k] else p[k])
        return a

    def crossover(self, p):
        a = []
        for i in range(self.num_crossover):
            c = sorted(np.random.choice(
                range(1, self.num_bit), self.num_of_cut, replace=False))
            [j, k] = np.random.choice(self.num_parent, 2, replace=False)

            a.append(
                np.concatenate((p[j][0:c[0]], p[k][c[0]:c[1]],
                               p[j][c[1]:self.num_bit]), axis=0)
            )
            a.append(
                np.concatenate((p[k][0:c[0]], p[j][c[0]:c[1]],
                               p[k][c[1]:self.num_bit]), axis=0)
            )
        return a

    def mutation(self, p):
        for _ in range(self.num_mutation):
            row = np.random.randint(self.num_crossover_2)
            col = np.random.randint(self.num_bit)
            p[row][col] = (p[row][col] + 1) % 2

    def sortChrome(self, a, a_fit):
        a_index = range(len(a))
        a_fit, a_index = zip(*sorted(zip(a_fit, a_index), reverse=True))
        return [a[i] for i in a_index], a_fit

    def replace(self, p, p_fit, a, a_fit):
        b = np.concatenate((p, a), axis=0)
        b_fit = p_fit + a_fit
        b, b_fit = self.sortChrome(b, b_fit)
        return b[:self.num_chrome], list(b_fit[:self.num_chrome])

    def main(self):

        # update variables

        # stores = stores_from_db

        # num_iteration = 50
        # num_chrome = 20
        # num_bit = 9

        # pc = 0.5
        # pm = 0.01

        # num_of_cut = 2
        # num_parent = num_chrome
        # num_crossover = int(pc * num_chrome / 2)
        # num_crossover_2 = num_crossover * 2
        # num_mutation = int(pm * num_chrome * num_bit)

        pop = self.initPop()
        pop_fit = self.evaluatePop(pop)

        best_outputs = [np.max(pop_fit)]
        mean_outputs = [np.average(pop_fit)]

        for i in tqdm.tqdm(range(self.num_iteration)):
            parent = self.selection(pop, pop_fit)
            offspring = self.crossover(parent)
            self.mutation(offspring)
            offspring_fit = self.evaluatePop(offspring)
            pop, pop_fit = self.replace(pop, pop_fit, offspring, offspring_fit)

            best_outputs.append(np.max(pop_fit))
            mean_outputs.append(np.average(pop_fit))

            # print("iteration %d: x = %s, y = %f, sum = %d" %
            #       (i, pop[0], pop_fit[0], pop[0].sum()))

        # return the best solution

        return pop[0], pop_fit[0]
