import numpy as np
from scipy.optimize import linear_sum_assignment
import tqdm
import datetime
# import matplotlib.pyplot
import math
import os
from dotenv import load_dotenv

load_dotenv()


class Gene:
    stores = []
    num_iteration = int(os.getenv("NUMBER_OF_ITERATIONS"))
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

    def __init__(self, stores_from_db, weekly_budget, weekly_movetime):
        self.stores = stores_from_db
        self.num_bit = len(stores_from_db)
        self.weekly_budget = weekly_budget
        self.weekly_movetime = weekly_movetime

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

                # TODO: 更新爽度
                # this_z = store["rating"] * 10 - \
                #     store["price"] - store["distance"] / 1000

                modified_params = {
                    "rating": store["rating"],
                    "price": store["price"],
                    "comment_cnt": store["ratingCount"],
                    "travel_time": store["travelTime"],
                }

                if modified_params["price"] == -1:
                    modified_params["price"] = 800

                if modified_params["rating"] == -1:
                    modified_params["rating"] = 2

                if modified_params["comment_cnt"] == -1 or modified_params["comment_cnt"] == 0:
                    modified_params["comment_cnt"] = 1 + 1e-10

                modified_params["comment_cnt"] = min(
                    modified_params["comment_cnt"], 1000)

                if modified_params["travel_time"]/60 > 15:
                    modified_params["travel_time"] = 30 * 60

                this_z = modified_params["rating"] * math.log10(modified_params["comment_cnt"]) * 2 \
                    + (3-math.log10(modified_params["price"] / 3)) * 10 / 3 \
                    + modified_params["travel_time"] / 60 / 3

                this_z *= 2

                # this_z max = 100

                # if store has key lastSelectedAt
                last_eaten = store.get("lastSelectedAt")

                if last_eaten is not None:
                    # Calculate the time since last eaten
                    # last_eaten is in milliseconds
                    last_eaten = datetime.datetime.fromtimestamp(
                        last_eaten / 1000)

                    time_since_last_eaten = now - last_eaten

                    if (time_since_last_eaten.days < 7):
                        this_z /= 2
                    elif (time_since_last_eaten.days < 14):
                        this_z /= 1.5
                    elif (time_since_last_eaten.days < 30):
                        this_z /= 1.2

                # Example constraints
                # if store["rating"] < 3.0:  # Penalize low-rated stores
                #     penalty_cnt += 1

                z += this_z

        if x.sum() != 7:  # Limit to 7 selected stores
            penalty_cnt += 1
        else:
            # calculate the possibility of the selected stores
            selected_stores = [self.stores[i]
                               for i in range(len(x)) if x[i] == 1]

            # check if the selected stores are within the budget
            total_price = sum(store["price"] if store["price"]
                              != -1 else 800 for store in selected_stores)

            if abs(total_price - self.weekly_budget) > 1500:
                penalty_cnt += 0.001
            elif abs(total_price - self.weekly_budget) > 1000:
                penalty_cnt += 0.0005
            elif abs(total_price - self.weekly_budget) > 500:
                penalty_cnt += 0.0001

            total_movetime = sum(store["travelTime"]
                                 for store in selected_stores)/60

            if total_movetime > self.weekly_movetime:
                penalty_cnt += 0.0001

            cost_matrix = []

            eating_time = os.getenv("EATING_TIME")

            hour = int(eating_time[0:2])
            minute = int(eating_time[3:5])

            for store in selected_stores:
                row = []

                for day in range(7):  # Days of the week (0-6)
                    # find if opening hours contains the day

                    index = store["openingHours"].index(
                        next(
                            (oh for oh in store["openingHours"] if oh["dayOfWeek"] == day), None)
                    ) if any(oh["dayOfWeek"] == day for oh in store["openingHours"]) else -1

                    if index != -1:
                        # find the opening hour
                        oh = store["openingHours"][index]

                        # Check if the eating time is within the opening hours
                        if (oh["openHour"] < hour or (oh["openHour"] == hour and oh["openMinute"] <= minute)) and \
                                (oh["closeHour"] > hour or (oh["closeHour"] == hour and oh["closeMinute"] >= minute)):
                            row.append(0)
                        else:
                            # Eating time is outside the opening hours
                            row.append(1e6)
                    else:
                        # Store is not open on this day
                        row.append(1e6)

                cost_matrix.append(row)

                # for day in range(7):  # Days of the week (0-6)
                #     if any(oh["dayOfWeek"] == day for oh in store["openingHours"]):
                #         # No cost if the store is open on this day
                #         row.append(0)
                #     else:
                #         row.append(1e6)  # High cost if the store is not open
                # cost_matrix.append(row)

            # Solve the assignment problem
            row_ind, col_ind = linear_sum_assignment(cost_matrix)

            total_cost = sum(cost_matrix[row][col]
                             for row, col in zip(row_ind, col_ind))
            if total_cost >= 1e6:  # If any store couldn't be assigned to an open day
                penalty_cnt += 0.001

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

        happiness = -1

        # return the best solution

        while (happiness < 0):
            for i in tqdm.tqdm(range(self.num_iteration)):
                parent = self.selection(pop, pop_fit)
                offspring = self.crossover(parent)
                self.mutation(offspring)
                offspring_fit = self.evaluatePop(offspring)
                pop, pop_fit = self.replace(
                    pop, pop_fit, offspring, offspring_fit)

                best_outputs.append(np.max(pop_fit))
                mean_outputs.append(np.average(pop_fit))

                # print("iteration %d: x = %s, y = %f, sum = %d" %
                #       (i, pop[0], pop_fit[0], pop[0].sum()))
            happiness = pop_fit[0]
            print("happiness: ", happiness)
            if happiness < 0:
                # update pop with new data
                new_pop = self.initPop()

                total_len = len(pop)
                half = int(len(pop) / 2)

                pop = np.concatenate(
                    (pop[:half], new_pop[:total_len-half]), axis=0)

        # plot the result

        # matplotlib.pyplot.plot(best_outputs)
        # matplotlib.pyplot.plot(mean_outputs)
        # matplotlib.pyplot.xlabel("Iteration")
        # matplotlib.pyplot.ylabel("Fitness")
        # matplotlib.pyplot.show()

        return pop[0], pop_fit[0]
